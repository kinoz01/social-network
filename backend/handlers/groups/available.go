package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// GET /api/groups/available
func AvailableGroupsHandler(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	rows, err := tp.DB.Query(`
    SELECT
        g.id,
        g.group_name,
        g.group_pic,
        g.description,

        /* "pending" if the user already sent a join-request */
        CASE
            WHEN EXISTS (
                SELECT 1
                  FROM group_requests gr
                 WHERE gr.group_id     = g.id
                   AND gr.requester_id = ?
            ) THEN 'pending'
        END AS request,

        /* current member count */
        (SELECT COUNT(*) FROM group_users gu2 WHERE gu2.group_id = g.id) AS members

    FROM groups g

    /* exclude groups the user already joined */
    LEFT JOIN group_users gu
           ON gu.group_id = g.id
          AND gu.users_id = ?

    WHERE g.group_owner <> ?          -- not the owner
      AND gu.users_id IS NULL         -- not a member
      /* exclude groups where the user already has an invitation */
      AND NOT EXISTS (
            SELECT 1
              FROM group_invitations gi
             WHERE gi.group_id  = g.id
               AND gi.invitee_id = ?
      )
	`, user.ID, /* for CASE (join‑request)        */
		user.ID, /* for LEFT JOIN (member check)   */
		user.ID, /* for owner <> ?                 */
		user.ID) /* for NOT EXISTS (invitation)    */
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()


	var list []tp.Group
	for rows.Next() {
		var req sql.NullString
		var g tp.Group

		if err := rows.Scan(
			&g.ID,
			&g.GroupName,
			&g.GroupPic,
			&g.Description,
			&req,
			&g.Members,
		); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		g.Request = req.String // "" when no row (i.e. no pending request)
		list = append(list, g)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
