package follows

import (
	"encoding/json"
	"net/http"
	"strconv"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type FollowingRequests struct {
	FollowingRequests []tp.User `json:"requests"`
	TotalCount        int       `json:"totalCount"`
	TotalPages        int       `json:"totalPages"`
}

func GetFollowingRequestsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	userId, err := help.GetUserId(r)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}
	limitQuery := r.URL.Query().Get("limit")
	pageQuery := r.URL.Query().Get("page")

	followingRequests, err := GetFollowingRequests(userId, limitQuery, pageQuery)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(followingRequests)
}

func GetFollowingRequests(id, limitQuery, pageQuery string) (*FollowingRequests, error) {
	var totalCount int

	stmnt := `SELECT COUNT(*) FROM follow_requests WHERE followed_id = ? AND status = "pending"`
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

	selectFollowRequests := `
SELECT
    users.id,
    users.first_name,
    users.last_name,
    users.profile_pic
FROM
    follow_requests
    JOIN users ON follow_requests.follower_id = users.id AND status = "pending"
WHERE
    followed_id = ?
LIMIT ? OFFSET ?
;
`
	rows, err := tp.DB.Query(selectFollowRequests, id, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followRequests []tp.User
	for rows.Next() {
		var followRequest tp.User

		if err := rows.Scan(&followRequest.ID, &followRequest.FirstName, &followRequest.LastName, &followRequest.ProfilePic); err != nil {
			return nil, err
		}

		followRequests = append(followRequests, followRequest)

	}

	if rows.Err() != nil {
		return nil, err
	}

	return &FollowingRequests{
		FollowingRequests: followRequests,
		TotalCount:        totalCount,
		TotalPages:        totalPages,
	}, nil
}
