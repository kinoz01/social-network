package follows

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func SuggestionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	userId, err := auth.GetUserId(r)
	if err != nil {
		help.JsonError(w, "Unauthorized.", http.StatusUnauthorized, err)
		return
	}

	suggestions, err := GetSuggestionss(userId)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}
	if len(suggestions) == 0 {
    	w.WriteHeader(http.StatusNoContent)
    	return
	}

	json.NewEncoder(w).Encode(suggestions)
}

func GetSuggestions(id string) ([]tp.User, error) {
	var suggestions []tp.User

	var totalCount int
	stmnt := `SELECT COUNT(*) FROM users WHERE users.id != ?`
	row := tp.DB.QueryRow(stmnt, id)
	if err := row.Scan(&totalCount); err != nil {
		return nil, err
	}

	src := rand.NewSource(time.Now().UnixNano())
	r := rand.New(src)

	randomOffset := r.Intn(totalCount)
	rows, err := tp.DB.Query(`
SELECT
    users.id,
    users.first_name,
    users.last_name,
    users.profile_pic
FROM
    users
LIMIT
    5
OFFSET
    0;`, randomOffset)
	if err != nil {
		return nil, err
	}
	// Handle the row as needed
	for rows.Next() {

		var user tp.User

		err = rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.ProfilePic)
		if err != nil {
			return nil, err
		}

		suggestions = append(suggestions, user)
	}
	fmt.Println("suggestions: ", suggestions)
	return suggestions, nil
}


func GetSuggestionss(userID string) ([]tp.User, error) {
    const limit = 5
    var list []tp.User

    rows, err := tp.DB.Query(`
        SELECT u.id,
               u.first_name,
               u.last_name,
               u.profile_pic
          FROM users u
         WHERE u.id <> ?                            -- exclude self
           AND NOT EXISTS (                         -- skip if I already follow
                 SELECT 1
                   FROM follow_requests fr
                  WHERE fr.follower_id = ?          -- me →
                    AND fr.followed_id = u.id
                    AND fr.status = 'accepted'
           )
         ORDER BY RANDOM()
         LIMIT ?`,
        userID,
        userID,
        limit,
    )
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    for rows.Next() {
        var u tp.User
        if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.ProfilePic); err != nil {
            return nil, err
        }
        list = append(list, u)
    }
    if err := rows.Err(); err != nil {
        return nil, err
    }
    return list, nil
}

