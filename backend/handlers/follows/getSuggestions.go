package follows

import (
	"encoding/json"
	"net/http"

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

	suggestions, err := GetSuggestions(userId)
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

func GetSuggestions(userID string) ([]tp.User, error) {
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
