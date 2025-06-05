package follows

import (
	"encoding/json"
	"net/http"
	"strconv"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type Followings struct {
	Followings []tp.User `json:"followings"`
	TotalCount int       `json:"totalCount"`
	TotalPages int       `json:"totalPages"`
}

func GetFollowingsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	userId := r.URL.Query().Get("id")
	limitQuery := r.URL.Query().Get("limit")
	pageQuery := r.URL.Query().Get("page")

	followings, err := GetFollowings(userId, limitQuery, pageQuery)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(followings)
}

func GetFollowings(id, limitQuery, pageQuery string) (*Followings, error) {
	var totalCount int

	stmnt := `SELECT COUNT(*) FROM follow_requests WHERE follower_id = ? AND status = "accepted"`
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
        users.id = follow_requests.followed_id AND follow_requests.follower_id = ? AND status = "accepted"
LIMIT ? OFFSET ?
;
`
	rows, err := tp.DB.Query(selectFollowers, id, limit, offset)
	if err != nil {
		return nil, err
	}
	
	defer rows.Close()

	var followings []tp.User

	for rows.Next() {
		var following tp.User

		if err := rows.Scan(&following.ID, &following.FirstName, &following.LastName, &following.ProfilePic, &following.AccountType); err != nil {
			return nil, err
		}

		followings = append(followings, following)

	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &Followings{
		Followings: followings,
		TotalCount: totalCount,
		TotalPages: totalPages,
	}, nil
}
