package follows

import (
	"encoding/json"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func AddFollowRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	var followRequest tp.FollowRequest

	if err := json.NewDecoder(r.Body).Decode(&followRequest); err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	selectFollowRequest := `
SELECT
    EXISTS (
    	SELECT
    	    1
    	FROM
    	    follow_requests
    	WHERE
    	    follower_id = ?
    	    AND followed_id = ?
    	    AND status = "accepted"
);`

	var exists bool

	if exists {
		help.JsonError(w, "You've already follwed this user", http.StatusBadRequest, nil)
		return
	}

	if err := tp.DB.QueryRow(selectFollowRequest, followRequest.FollowerID, followRequest.FollowedID).Scan(&exists); err != nil {
		help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)

		return
	}

	id := uuid.Must(uuid.NewV4())

	if followRequest.Action == "friendRequest" {

		insertFollower := `
							INSERT INTO 
								follow_requests (id, follower_Id, followed_Id, status)
							VALUES
								(?, ?, ?, ?)`

		if _, err := tp.DB.Exec(insertFollower, id, followRequest.FollowerID, followRequest.FollowedID, "pending"); err != nil {

			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
		}
	} else if followRequest.Status == "accepted" {

		deleteFollowRequest := `
							UPDATE
								follow_requests 
							SET 
								status = "accepted"
							WHERE
								follower_id = ? AND followed_id = ? AND status = "pending"
							`

		if _, err := tp.DB.Exec(deleteFollowRequest, followRequest.FollowerID, followRequest.FollowedID); err != nil {

			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
		}

	} else if followRequest.Action == "follow" {

		insertFollower := `
							INSERT INTO 
								follow_requests (id, follower_Id, followed_Id, status)
							VALUES
								(?, ?, ?, ?)`

		if _, err := tp.DB.Exec(insertFollower, id, followRequest.FollowerID, followRequest.FollowedID, "accepted"); err != nil {

			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
		}

	} else if followRequest.Status == "rejected" || followRequest.Action == "unfollow" {
		insertFollower := `
							DELETE 
							FROM
								follow_requests 
							WHERE
							follower_id = ? AND followed_id = ?
							`

		if _, err := tp.DB.Exec(insertFollower, followRequest.FollowerID, followRequest.FollowedID); err != nil {

			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
		}

	}
	json.NewEncoder(w).Encode("success!")
}
