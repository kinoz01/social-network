package groups

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
	ws "social-network/handlers/websocket"

	"github.com/gofrs/uuid"
)

// This is used when a user wants to join a group
// Inserts a row into group_requests (if it isn't there already)
func JoinRequest(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	var body struct {
		GroupID string `json:"group_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" {
		help.JsonError(w, "Bad request", http.StatusBadRequest, err)
		return
	}

	// return if already a member (owner is a member too)
	var isMember bool
	if err := tp.DB.QueryRow(
		`SELECT EXISTS(
			SELECT 1 FROM group_users
			WHERE group_id = ? AND users_id = ?
		)`, body.GroupID, user.ID,
	).Scan(&isMember); err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}
	if isMember {
		help.JsonError(w, "You are already a member of this group", http.StatusConflict, nil)
		return
	}

	// insert request + notification
	if err := JoinRequestNotif(body.GroupID, *user); err != nil {
		help.JsonError(w, err.Error(), http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// helper: wraps all DB work + websocket notification broadcast
func JoinRequestNotif(groupID string, requester tp.User) error {
	tx, err := tp.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() //- rolls back if Commit is never reached or fails

	// group name + owner
	var ownerID, groupName string
	if err := tx.QueryRow(
		`SELECT group_owner, group_name FROM groups WHERE id = ?`,
		groupID,
	).Scan(&ownerID, &groupName); err != nil {
		return err
	}

	//- Not he same case as invitation, because here we have the "pending" toggle on the frontend
	reqID := uuid.Must(uuid.NewV4()).String() //- which forbid user to send a new request (until the previous one is accepted or rejected)
	if _, err = tx.Exec(
		`INSERT INTO group_requests (id, group_id, requester_id)
			 VALUES (?, ?, ?)`,
		reqID, groupID, requester.ID,
	); err != nil {
		return err //- if user don't use UI he will be stopped here by the UNIQUE constraint in db
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	// create notification 
	notif := tp.Notification{
		ID:        uuid.Must(uuid.NewV4()).String(),
		Type:      "join_request",
		Content:   fmt.Sprintf("wants to join your group '%s'", groupName),
		Receiver:  ownerID,
		Sender:    requester,
		Group:     groupID,
		RequestID: reqID,
		IsRead:    false,
		CreatedAt: time.Now().Local().Format("2006-01-02 15:04:05"),
	}

	ws.BroadcastNotification(notif)

	return nil
}
