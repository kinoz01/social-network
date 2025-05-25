package groups

import (
	"encoding/json"
	"fmt"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func InviteFollowers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, nil)
		return
	}

	var body struct {
		GroupID    string          `json:"group_id"`
		InviteeIDs json.RawMessage `json:"invitee_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" {
		help.JsonError(w, "bad json", http.StatusBadRequest, nil)
		return
	}

	/* make sure caller is at least a member */
	var ok bool
	if err := tp.DB.QueryRow(`
	    SELECT EXISTS(SELECT 1 FROM group_users
	                  WHERE group_id=? AND users_id=?)`,
		body.GroupID, user.ID).Scan(&ok); err != nil || !ok {
		help.JsonError(w, "forbidden", http.StatusForbidden, nil)
		return
	}

	var ids []string
	if err := json.Unmarshal(body.InviteeIDs, &ids); err != nil {
		help.JsonError(w, "invalid invitee_ids", http.StatusBadRequest, err)
		return
	}
	if len(ids) > 0 {
		if err := Invite(body.GroupID, ids); err != nil {
			help.JsonError(w, err.Error(), http.StatusBadRequest, err)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

// Invites follwer to join a group if they are not already a member
func Invite(groupID string, ids []string) error {
	if len(ids) > 7000 {
		return fmt.Errorf("too many invitees (max 7000)")
	}
	// Start transaction
	tx, err := tp.DB.Begin()
	if err != nil {
		return err
	}

	// Prepare insert statement
	stmt, err := tx.Prepare(`
		INSERT OR IGNORE INTO group_invitations (id, group_id, invitee_id)
		SELECT ?, ?, ?
		WHERE NOT EXISTS (
			SELECT 1 FROM group_users gu
			WHERE gu.group_id = ? AND gu.users_id = ?
		)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	// Loop through follower IDs
	for _, uid := range ids {
		_, err := stmt.Exec(uuid.Must(uuid.NewV4()).String(), groupID, uid, groupID, uid)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// Commit transaction
	return tx.Commit()
}
