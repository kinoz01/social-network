package follows

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func IsFollwedHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserId(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
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
