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

	followers, err := GetSuggestions(userId)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(followers)
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
