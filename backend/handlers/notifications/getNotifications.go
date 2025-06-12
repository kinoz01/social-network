package notifications

import (
	"database/sql"

	tp "social-network/handlers/types"
)

type Notifcations struct {
	Notifications []*tp.Notification `json:"notifications"`
	TotalCount    int                `json:"totalCount"`
	TotalPages    int                `json:"totalPages"`
}

func GetNotifications(id string, limitQuery, pageQuery int) (*Notifcations, error) {
	/* total count (for paging) */
	var totalCount int
	if err := tp.DB.QueryRow(
		`SELECT COUNT(*) FROM notifications WHERE receiver_id = ?`,
		id,
	).Scan(&totalCount); err != nil {
		return nil, err
	}

	offset := (pageQuery - 1) * limitQuery
	totalPages := (totalCount + limitQuery - 1) / limitQuery

	/* fetch the rows */
	const q = `
		SELECT
		    /* sender (may be NULL for system notifications) */
		    u.id          AS sender_id,
		    u.first_name,
		    u.last_name,
		    u.profile_pic,

		    /* notification itself */
		    n.id,
		    n.receiver_id,
		    n.type,
		    n.content,
		    n.related_group_id,
		    n.related_event_id,
		    n.related_invitation_id,
		    n.related_request_id,
		    n.created_at,
		    n.is_read
		FROM
		    notifications n
		    LEFT JOIN users u ON u.id = n.sender_id
		WHERE
		    n.receiver_id = ?
		ORDER BY
		    n.created_at DESC, n.ROWID DESC
		LIMIT ? OFFSET ?`

	rows, err := tp.DB.Query(q, id, limitQuery, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []*tp.Notification
	for rows.Next() {
		var n tp.Notification

		/* nullable FK columns */
		var groupID, eventID, invitationID, requestID sql.NullString

		if err := rows.Scan(
			/* sender */
			&n.Sender.ID,
			&n.Sender.FirstName,
			&n.Sender.LastName,
			&n.Sender.ProfilePic,
			/* notification core */
			&n.ID,
			&n.Receiver,
			&n.Type,
			&n.Content,
			/* contextual FKs */
			&groupID,
			&eventID,
			&invitationID,
			&requestID,
			/* meta */
			&n.CreatedAt,
			&n.IsRead,
		); err != nil {
			return nil, err
		}

		/* copy nullable fields into the struct */
		if groupID.Valid {
			n.Group = groupID.String
		}
		if eventID.Valid {
			n.Event = eventID.String
		}
		if invitationID.Valid {
			n.InvitationID = invitationID.String
		}
		if requestID.Valid {
			n.RequestID = requestID.String
		}

		notifications = append(notifications, &n)
	}

	return &Notifcations{
		Notifications: notifications,
		TotalCount:    totalCount,
		TotalPages:    totalPages,
	}, nil
}
