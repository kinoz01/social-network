package follows

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type Followers struct {
	Followers  []tp.User `json:"followers"`
	TotalCount int       `json:"totalCount"`
	TotalPages int       `json:"totalPages"`
}

func GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	userId, err := help.GetUserId(r)
	limitQuery := r.URL.Query().Get("limit")
	pageQuery := r.URL.Query().Get("page")

	followers, err := GetFollowers(userId, limitQuery, pageQuery)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(followers)
}

func GetFollowers(id, limitQuery, pageQuery string) (*Followers, error) {
	var totalCount int
	stmnt := fmt.Sprintf(`SELECT COUNT(*) FROM follow_requests WHERE followed_id = ? AND status = "accepted"`)
	row := tp.DB.QueryRow(stmnt, id)
	if err := row.Scan(&totalCount); err != nil {
		return nil, err
	}

	page := 1
	limit := 10

	if pageQuery != "" {
		intPage, err := strconv.Atoi(pageQuery)
		if err != nil {
			return nil, err
		}
		if intPage <= 0 {
			intPage = page
		}
		page = intPage
	}

	if limitQuery != "" {
		intLimit, err := strconv.Atoi(limitQuery)
		if err != nil {
			return nil, err
		}

		if intLimit <= 0 {
			intLimit = limit
		}

		limit = intLimit
	}

	offset := (page - 1) * limit

	totalPages := (totalCount + limit - 1) / limit

	selectFollowers := `
SELECT
    users.id,
    users.first_name,
    users.last_name,
    users.profile_pic,
    users.account_type
FROM
    follow_requests
JOIN
    users ON
        users.id = follow_requests.follower_id AND follow_requests.followed_id = ?  AND status = "accepted"   
LIMIT ? OFFSET ?
;
`
	rows, err := tp.DB.Query(selectFollowers, id, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followers []tp.User

	for rows.Next() {
		var follower tp.User

		if err := rows.Scan(&follower.ID, &follower.FirstName, &follower.LastName, &follower.ProfilePic, &follower.AccountType); err != nil {
			return nil, err
		}

		followers = append(followers, follower)

	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &Followers{
		Followers:  followers,
		TotalCount: totalCount,
		TotalPages: totalPages,
	}, nil
}
