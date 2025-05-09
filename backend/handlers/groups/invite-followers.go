package groups

import (
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

// Invite every user follower who is NOT already a member
func InviteAllFollowers(groupID, ownerID string) error {
	rows, err := tp.DB.Query(`
		SELECT fr.follower_id
		  FROM follow_requests fr
		  LEFT JOIN group_users gu
		         ON gu.group_id = ? AND gu.users_id = fr.follower_id
		 WHERE fr.followed_id = ?
		   AND fr.status      = 'accepted'
		   AND gu.users_id IS NULL`, groupID, ownerID)
	if err != nil {
		return err
	}
	defer rows.Close()

	tx, err := tp.DB.Begin()
	if err != nil {
		return err
	}
	stmt, err := tx.Prepare(`
		INSERT OR IGNORE INTO group_invitations (id, group_id, invitee_id)
		VALUES (?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for rows.Next() {
		var uid string
		if rows.Scan(&uid) == nil {
			_, _ = stmt.Exec(uuid.Must(uuid.NewV4()).String(), groupID, uid)
		}
	}
	return tx.Commit()
}

// Invites a list of users to join a group.
func InviteFollowers(groupID string, ids []string) error {
	for _, uid := range ids {
		_, err := tp.DB.Exec(`
			INSERT OR IGNORE INTO group_invitations (id, group_id, invitee_id)
			SELECT ?, ?, ?
			WHERE NOT EXISTS (
				SELECT 1 FROM group_users gu
				WHERE gu.group_id = ? AND gu.users_id = ?
			)`,
			uuid.Must(uuid.NewV4()).String(), groupID, uid, groupID, uid)
		if err != nil {
			return err
		}
	}
	return nil
}
