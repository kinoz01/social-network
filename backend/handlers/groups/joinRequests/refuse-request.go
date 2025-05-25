package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func RefuseJoinRequest(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", 401, err)
		return
	}

	var body struct {
		RequestID string `json:"request_id"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.RequestID == "" {
		help.JsonError(w, "Bad request", 400, err)
		return
	}

	/* ensure the request belongs to a group the caller owns */
	res, err := tp.DB.Exec(`
		UPDATE group_requests
		   SET status = 'rejected'
		 WHERE id = ?
		   AND group_id IN (SELECT id FROM groups WHERE group_owner = ?)`,
		body.RequestID, user.ID)
	if err != nil {
		help.JsonError(w, "DB error", 500, err)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		help.JsonError(w, "Forbidden", 403, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"ok": true})
}
