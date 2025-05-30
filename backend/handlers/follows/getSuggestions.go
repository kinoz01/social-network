package follows

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func GetSuggestionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	userId, err := help.GetUserId(r)

	followers, err := GetSuggestions(userId)
	fmt.Println("err:= ", err)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(followers)
}

func GetSuggestions(id string) ([]tp.User, error) {
	var suggestions []tp.User

	var totalCount int
	stmnt := fmt.Sprintf(`SELECT COUNT(*) FROM users WHERE users.id != ?`)
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

// 	page := 1
// 	limit := 10

// 	if pageQuery != "" {
// 		intPage, err := strconv.Atoi(pageQuery)
// 		if err != nil {
// 			return nil, err
// 		}
// 		if intPage <= 0 {
// 			intPage = page
// 		}
// 		page = intPage
// 	}

// 	if limitQuery != "" {
// 		intLimit, err := strconv.Atoi(limitQuery)
// 		if err != nil {
// 			return nil, err
// 		}

// 		if intLimit <= 0 {
// 			intLimit = limit
// 		}

// 		limit = intLimit
// 	}

// 	offset := (page - 1) * limit

// 	totalPages := (totalCount + limit - 1) / limit

// 	selectFollowers := `
// SELECT
//     users.id,
//     users.first_name,
//     users.last_name,
//     users.profile_pic,
//     users.account_type
// FROM
//     follow_requests
// JOIN
//     users ON
//         users.id = follow_requests.follower_id AND follow_requests.followed_id = ?  AND status = "accepted"
// LIMIT ? OFFSET ?
// ;
// `
// 	rows, err := tp.DB.Query(selectFollowers, id, limit, offset)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer rows.Close()

// 	var followers []tp.User

// 	for rows.Next() {
// 		var follower tp.User

// 		if err := rows.Scan(&follower.ID, &follower.FirstName, &follower.LastName, &follower.ProfilePic, &follower.AccountType); err != nil {
// 			return nil, err
// 		}

// 		followers = append(followers, follower)

// 	}

// 	if err := rows.Err(); err != nil {
// 		return nil, err
// 	}

// 	return &Followers{
// 		Followers:  followers,
// 		TotalCount: totalCount,
// 		TotalPages: totalPages,
// 	}, nil
// }
