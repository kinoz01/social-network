package groups

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
	ws "social-network/handlers/websocket"

	"github.com/gofrs/uuid"
)

/*──────────── structs ───────────*/
type createEventReq struct {
	GroupID     string `json:"group_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	StartTime   string `json:"start_time"` // RFC 3339 string
	Going       bool   `json:"going"`      // creator's own response
}

type eventResp struct {
	ID            string    `json:"id"`
	GroupID       string    `json:"group_id"`
	CreatorID     string    `json:"creator_id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	StartTime     time.Time `json:"start_time"`
	GoingCount    int       `json:"going_count"`
	NotGoingCount int       `json:"not_going_count"`
	Going         *bool     `json:"going"` // creator's own response
	CreatedAt     time.Time `json:"created_at"`
}

/*──────────── POST /api/groups/create-event ───────────*/
func CreateEvent(w http.ResponseWriter, r *http.Request) {
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	var req createEventReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		help.JsonError(w, "bad json", http.StatusBadRequest, err)
		return
	}

	if strings.TrimSpace(req.Title) == "" {
		help.JsonError(w, "title required", http.StatusBadRequest, nil)
		return
	}
	start, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil || start.Before(time.Now()) {
		help.JsonError(w, "invalid start_time", http.StatusBadRequest, nil)
		return
	}

	eid := uuid.Must(uuid.NewV4()).String()
	tx, _ := tp.DB.Begin()

	// insert event
	if _, err := tx.Exec(`
		INSERT INTO group_events
		     (id, group_id, creator_id, title, description, start_time)
		VALUES (?,  ?,        ?,          ?,     ?,           ?)`,
		eid, req.GroupID, u.ID, req.Title, req.Description, start,
	); err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	// creator's initial response
	resp := "not_going"
	if req.Going {
		resp = "going"
	}
	if _, err := tx.Exec(`
		INSERT INTO event_responses (id, event_id, user_id, response)
		VALUES (?,?,?,?)`,
		uuid.Must(uuid.NewV4()).String(), eid, u.ID, resp,
	); err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	// fetch all other group members
	rows, err := tx.Query(`
		SELECT u.id, u.first_name, u.last_name, u.profile_pic
		FROM users u
		JOIN group_users gu ON gu.users_id = u.id
		WHERE gu.group_id = ? AND u.id <> ?`,
		req.GroupID, u.ID,
	)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	var toBroadcast []tp.Notification
	for rows.Next() {
		var recv tp.User
		if err := rows.Scan(&recv.ID, &recv.FirstName, &recv.LastName, &recv.ProfilePic); err != nil {
			tx.Rollback()
			help.JsonError(w, "db error", http.StatusInternalServerError, err)
			return
		}

		n := tp.Notification{
			ID:        uuid.Must(uuid.NewV4()).String(),
			Type:      "event_created",
			Content:   fmt.Sprintf("created a new event '%s'", req.Title),
			Receiver:  recv.ID,
			Sender:    *u,
			Group:     req.GroupID,
			Event:     eid,
			IsRead:    false,
			CreatedAt: time.Now().Local().Format("2006-01-02 15:04:05"),
		}
		toBroadcast = append(toBroadcast, n)
	}

	// commit transaction
	if err := tx.Commit(); err != nil {
		help.JsonError(w, "commit failed", http.StatusInternalServerError, err)
		return
	}

	// HTTP response
	respBody := eventResp{
		ID:            eid,
		GroupID:       req.GroupID,
		CreatorID:     u.ID,
		Title:         req.Title,
		Description:   req.Description,
		StartTime:     start,
		GoingCount:    btoi(req.Going),
		NotGoingCount: btoi(!req.Going),
		Going:         &req.Going,
		CreatedAt:     time.Now(),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(respBody)

	// broadcast notifications
	for _, n := range toBroadcast {
		go ws.BroadcastNotification(n)
	}
}

func btoi(b bool) int {
	if b {
		return 1
	}
	return 0
}
