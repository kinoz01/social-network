package groups

import (
	"encoding/json"
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

/* ────────── payloads ────────── */
type createEventReq struct {
	GroupID     string `json:"group_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	StartTime   string `json:"start_time"`
	Going       bool   `json:"going"`
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
	CreatorGoing  bool      `json:"creator_going"`
	CreatedAt     time.Time `json:"created_at"`
}

/* ────────── POST /api/groups/events ────────── */
func CreateEventHandler(w http.ResponseWriter, r *http.Request) {
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauth", 401, err)
		return
	}

	var req createEventReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		help.JsonError(w, "bad json", 400, err)
		return
	}

	if req.Title == "" {
		help.JsonError(w, "title required", 400, nil)
		return
	}

	start, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil || start.Before(time.Now()) {
		help.JsonError(w, "invalid start_time", 400, nil)
		return
	}

	eid := uuid.Must(uuid.NewV4()).String()

	tx, _ := tp.DB.Begin()
	_, err = tx.Exec(`
	    INSERT INTO group_events (id, group_id, creator_id, title, description, start_time)
	    VALUES (?, ?, ?, ?, ?, ?)`,
		eid, req.GroupID, u.ID, req.Title, req.Description, start,
	)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", 500, err)
		return
	}

	status := "not_going"
	if req.Going {
		status = "going"
	}
	aid := uuid.Must(uuid.NewV4()).String()
	_, err = tx.Exec(`
	    INSERT INTO group_event_attendance (id, event_id, user_id, status)
	    VALUES (?,?,?,?)`, aid, eid, u.ID, status)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", 500, err)
		return
	}
	tx.Commit()

	resp := eventResp{
		ID:            eid,
		GroupID:       req.GroupID,
		CreatorID:     u.ID,
		Title:         req.Title,
		Description:   req.Description,
		StartTime:     start,
		GoingCount:    btoi(req.Going),
		NotGoingCount: btoi(!req.Going),
		CreatorGoing:  req.Going,
		CreatedAt:     time.Now(),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func btoi(b bool) int {
	if b {
		return 1
	}
	return 0
}

/* ────────── GET /api/groups/events?group_id=… ────────── */
func ListEventsHandler(w http.ResponseWriter, r *http.Request) {
	gid := r.URL.Query().Get("group_id")
	if gid == "" {
		help.JsonError(w, "group_id required", 400, nil)
		return
	}

	rows, err := tp.DB.Query(`
	    SELECT e.id, e.creator_id, e.title, e.description, e.start_time, e.created_at,
	           SUM(CASE WHEN a.status='going'     THEN 1 ELSE 0 END) as going_cnt,
	           SUM(CASE WHEN a.status='not_going' THEN 1 ELSE 0 END) as notgoing_cnt
	      FROM group_events e
	      LEFT JOIN group_event_attendance a ON a.event_id = e.id
	      WHERE e.group_id = ?
	      GROUP BY e.id
	      ORDER BY e.start_time ASC`, gid)
	if err != nil {
		help.JsonError(w, "db error", 500, err)
		return
	}
	defer rows.Close()

	var out []eventResp
	for rows.Next() {
		var ev eventResp
		rows.Scan(&ev.ID, &ev.CreatorID, &ev.Title, &ev.Description,
			&ev.StartTime, &ev.CreatedAt, &ev.GoingCount, &ev.NotGoingCount)
		ev.GroupID = gid
		out = append(out, ev)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}

/* ────────── route wiring (patch) ────────── */

// in handlers/groups/routes.go or wherever you build your mux:
// func RegisterGroupRoutes(r *mux.Router) {
// 	// existing …
// 	r.HandleFunc("/api/groups/events", grps.CreateEventHandler).Methods("POST")
// 	r.HandleFunc("/api/groups/events", groups.ListEventsHandler).Methods("GET")
// }
