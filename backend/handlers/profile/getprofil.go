package profile

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	tp "social-network/handlers/types"

	Error "social-network/handlers/helpers"
)

type UserId struct {
	UserId string `json:"logeduser_id"`
}

func ProfileData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		Error.JsonError(w, "Method not allowed", 405, nil)
		return
	}

	var userdata tp.UserData
	useid := strings.Split(r.URL.Path, "/")[3]
	defer r.Body.Close()
	err := tp.DB.QueryRow(`SELECT 
	first_name,
	last_name,
	birthday,
	about_me,
	profile_pic,
	account_type,
	email,
	username,
    (
        SELECT 
      COUNT(*) 
      from follow_requests 
      WHERE 
      follow_requests.followed_id =  ?
    ) as total_follower,
    (
        SELECT 
      COUNT(*) 
      from follow_requests 
      WHERE 
      follow_requests.follower_id = ?
    ) as total_follower
	from 
	users 
    
	where 
	id = ?`, useid, useid, useid).Scan(&userdata.Firstname,
		&userdata.Lastname,
		&userdata.Birthday,
		&userdata.About_me,
		&userdata.Profile_pic,
		&userdata.AccountType,
		&userdata.Email,
		&userdata.Username,
		&userdata.TotalFollowers,
		&userdata.TotalFollowings,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userdata)
}
