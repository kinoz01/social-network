package follows

import (
	"encoding/json"
	"fmt"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func FollowRequestHanlder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	var followerRequest tp.FollowRequest

	if err := json.NewDecoder(r.Body).Decode(&followerRequest); err != nil {
		fmt.Println("follow err1: ", err, followerRequest)

		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	fmt.Println("follow req: ", followerRequest)

	id := uuid.Must(uuid.NewV4())

	insertFollower := `
							INSERT INTO 
								follow_requests (id, follower_Id, followed_Id, status)
							VALUES
								(?, ?, ?, ?)`

	if _, err := tp.DB.Exec(insertFollower, id, followerRequest.FollowerID, followerRequest.FollowedID, followerRequest.Status); err != nil {

		fmt.Println("follow err2: ", err)
		help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
		return
	}
}
