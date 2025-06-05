package follows

import (
	"encoding/json"
	"fmt"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func ProfileInfoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	profileID := r.URL.Query().Get("id")
	if profileID == "" {
		id, err := help.GetUserId(r)
		if err != nil {
			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
		}
		profileID = id
	}

	checkUser := `
SELECT
    EXISTS (
        SELECT
            1
        FROM
            users
        WHERE
             id = ?
    );`

	var userExists bool

	if err := tp.DB.QueryRow(checkUser, profileID).Scan(&userExists); err != nil {
		fmt.Println("profile err exists: ", err, userExists)
		help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
		return
	}

	if !userExists {
		help.JsonError(w, "Page Not Found!", http.StatusNotFound, nil)
		return
	}

	getInfo := `
SELECT
    users.id, 
    users.first_name,
    users.last_name,
	users.profile_pic, 
	users.account_type
From
    users
		LEFT JOIN 
			follow_requests
		ON
			users.id = follow_requests.followed_id 
WHERE
    users.id = ? ;
`

	var user tp.User

	if err := tp.DB.QueryRow(getInfo, profileID).Scan(&user.ID, &user.FirstName, &user.LastName, &user.ProfilePic, &user.AccountType); err != nil {
		help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(user)
}
