package follows

import (
	"encoding/json"
	"fmt"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func FollowingRequestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	var follower tp.Follower

	if err := json.NewDecoder(r.Body).Decode(&follower); err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	selectFollower := `
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

	var followerExist bool
	fmt.Println("follow req: ", follower)

	if err := tp.DB.QueryRow(selectFollower, follower.FollowerID, follower.FollowedID).Scan(&followerExist); err != nil {
		fmt.Println("exist err: ", err)

		help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)

		return
	}

	id := uuid.Must(uuid.NewV4())

	if follower.Action == "follow" || follower.Action == "accepted" {
		if followerExist {
			help.JsonError(w, "You've already follwed this user", http.StatusBadRequest, nil)
			return
		}

		if follower.Status == "accepted" {
			fmt.Println("heeeeere: 0")
			deleteFollowRequest := `
							UPDATE
								follow_requests 
							SET 
								status = "accepted"
							WHERE
								follower_id = ? AND followed_id = ? AND status = "pending"
							`

			if _, err := tp.DB.Exec(deleteFollowRequest, follower.FollowerID, follower.FollowedID); err != nil {
				fmt.Println("err delete1: ", err)

				help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
				return
			}

		} else {
			insertFollower := `
							INSERT INTO 
								follow_requests (id, follower_Id, followed_Id, status)
							VALUES
								(?, ?, ?, ?)`

			if _, err := tp.DB.Exec(insertFollower, id, follower.FollowerID, follower.FollowedID, follower.Status); err != nil {
				fmt.Println("err:1 ", err)

				help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
				return
			}
		}

	} else if follower.Action == "rejected" || follower.Action == "unfollow" {
		insertFollower := `
							DELETE 
							FROM
								follow_requests 
							WHERE
							follower_id = ? AND followed_id = ?
							`

		if _, err := tp.DB.Exec(insertFollower, follower.FollowerID, follower.FollowedID); err != nil {
			fmt.Println("err: ", err)

			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
		}

	}
	json.NewEncoder(w).Encode("success!")
}
