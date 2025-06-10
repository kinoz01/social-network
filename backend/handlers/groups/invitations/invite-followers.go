package groups

import (
	"encoding/json"
	"fmt"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
	ws "social-network/handlers/websocket"

	"github.com/gofrs/uuid"
)

func InviteFollowers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	inviter, _ := auth.GetUser(r)

	var body struct {
		GroupID    string          `json:"group_id"`
		InviteeIDs json.RawMessage `json:"invitee_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" {
		help.JsonError(w, "bad json", http.StatusBadRequest, err)
		return
	}

	var ids []string
	if err := json.Unmarshal(body.InviteeIDs, &ids); err != nil {
		help.JsonError(w, "invalid invitee_ids", http.StatusBadRequest, err)
		return
	}
	if len(ids) > 0 {
		if err := Invite(body.GroupID, *inviter, ids); err != nil {
			help.JsonError(w, err.Error(), http.StatusBadRequest, err)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

// Invite followers to join a group and notify them
func Invite(groupID string, inviter tp.User, inviteeIDs []string) error {
	if len(inviteeIDs) > 7000 {
		return fmt.Errorf("too many invitees (max 7000)")
	}

	tx, err := tp.DB.Begin()
	if err != nil {
		return err
	}

	invStmt, err := tx.Prepare(`
	  INSERT OR IGNORE INTO group_invitations (id, group_id, invitee_id)
	  SELECT ?, ?, ?
	  WHERE NOT EXISTS (
	    SELECT 1 FROM group_users WHERE group_id = ? AND users_id = ?
	  )`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer invStmt.Close()

	var toBroadcast []tp.Notification

	for _, uid := range inviteeIDs {
		invID := uuid.Must(uuid.NewV4()).String()
		res, err := invStmt.Exec(invID, groupID, uid, groupID, uid)
		if err != nil {
			tx.Rollback()
			return err
		}

		if n, _ := res.RowsAffected(); n == 0 {
			continue // already a member or invited: skip
		}

		toBroadcast = append(toBroadcast, tp.Notification{
			Type:         "group_invite",
			Content:      "invited you to join a group",
			Receiver:     uid,
			Sender:       inviter,
			Group:        groupID,
			InvitationID: invID,
			IsRead:       false,
		})
	}

	if err = tx.Commit(); err != nil {
		return err
	}

	// insert + broadcast
	for _, n := range toBroadcast {
		go ws.BroadcastNotification(n)
	}
	return nil
}
