package groups

import (
	"database/sql"
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

// inviting end-point called from group invite menu
func InviteFollowers(w http.ResponseWriter, r *http.Request) {
	inviter, _ := auth.GetUser(r)

	var body struct {
		GroupID    string   `json:"group_id"`
		InviteeIDs []string `json:"invitee_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" {
		help.JsonError(w, "bad json", http.StatusBadRequest, err)
		return
	}

	if len(body.InviteeIDs) > 0 {
		if err := Invite(body.GroupID, *inviter, body.InviteeIDs); err != nil {
			help.JsonError(w, err.Error(), http.StatusBadRequest, err)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

// Invite followers to join a group and notify them (if not already a member)
// Allows multiple users to invite the same person, but avoids duplicate notifs from the same sender
// if user is re-invited send notif if it's not already there.
func Invite(groupID string, inviter tp.User, inviteeIDs []string) error {
	if len(inviteeIDs) > 7000 {
		return fmt.Errorf("too many invitees (max 7000)")
	}

	tx, err := tp.DB.Begin()
	if err != nil {
		return err
	}

	var groupName string
	err = tp.DB.QueryRow(`SELECT group_name FROM groups WHERE id = ?`, groupID).Scan(&groupName)
	if err != nil {
		return fmt.Errorf("failed to fetch group name: %w", err)
	}

	// Prepare insert for new invitations
	invStmt, err := tx.Prepare(`
		INSERT INTO group_invitations (id, group_id, invitee_id)
		VALUES (?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer invStmt.Close()

	// Precompiled statements
	isMemberStmt := `
	SELECT EXISTS (
		SELECT 1 FROM group_users
		WHERE group_id = ? AND users_id = ?
	);`

	getExistingInvStmt := `
	SELECT id FROM group_invitations
	WHERE group_id = ? AND invitee_id = ?`

	checkNotifStmt := `
	SELECT EXISTS (
		SELECT 1 FROM notifications
		WHERE receiver_id = ?
		AND sender_id = ?
		AND related_group_id = ?
		AND type = 'group_invite'
	);`

	var toBroadcast []tp.Notification

	for _, uid := range inviteeIDs {
		// Check membership
		var isMember bool
		if err := tx.QueryRow(isMemberStmt, groupID, uid).Scan(&isMember); err != nil {
			tx.Rollback()
			return err
		}
		if isMember {
			continue
		}

		// Try to get existing invitation ID
		var invID string
		err := tx.QueryRow(getExistingInvStmt, groupID, uid).Scan(&invID)
		if err == sql.ErrNoRows {
			// Create and insert a new invitation
			invID = uuid.Must(uuid.NewV4()).String()
			_, err = invStmt.Exec(invID, groupID, uid)
			if err != nil {
				tx.Rollback()
				return err
			}
		} else if err != nil {
			tx.Rollback()
			return err
		}

		// Check if this sender already sent a notification for this group
		var alreadyNotified bool
		err = tx.QueryRow(checkNotifStmt, uid, inviter.ID, groupID).Scan(&alreadyNotified)
		if err != nil {
			tx.Rollback()
			return err
		}
		if alreadyNotified {
			continue
		}

		// Queue notification
		toBroadcast = append(toBroadcast, tp.Notification{
			ID:           uuid.Must(uuid.NewV4()).String(),
			Type:         "group_invite",
			Content:      fmt.Sprintf("invited you to join '%s' group", groupName),
			Receiver:     uid,
			Sender:       inviter,
			Group:        groupID,
			InvitationID: invID,
			IsRead:       false,
			CreatedAt:    time.Now().Local().Format("2006-01-02 15:04:05"),
		})
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return err
	}

	// Dispatch notifications after DB commit
	for _, n := range toBroadcast {
		go ws.BroadcastNotification(n)
	}

	return nil
}
