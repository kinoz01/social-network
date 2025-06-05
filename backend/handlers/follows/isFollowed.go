package follows

import (
	"encoding/json"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func IsFollwedHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	userID, err := help.GetUserId(r)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	profileID := r.URL.Query().Get("profileid")

	selectFollower := `
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM follow_requests
      WHERE followed_id = ? AND follower_id = ? AND status = 'accepted'
    ) THEN 'isFollowed'
    WHEN EXISTS (
      SELECT 1
      FROM follow_requests
      WHERE followed_id = ? AND follower_id = ? AND status = 'pending'
    ) THEN 'hasFollowingRequest'
    ELSE 'noRelationship'
  END AS relationship
;`

	var isFollowed string

	if err := tp.DB.QueryRow(selectFollower, profileID, userID, profileID, userID).Scan(&isFollowed); err != nil {
		help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(isFollowed)
}
