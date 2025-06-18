package follows

import (
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type ReqUser struct {
	FollowID   string `json:"followId"`
	ID         string `json:"id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	ProfilePic string `json:"profile_pic"`
}

type FollowingRequests struct {
	FollowingRequests []ReqUser `json:"requests"`
	TotalCount        int       `json:"totalCount"`
	TotalPages        int       `json:"totalPages"`
}

func GetFollowingRequestsHandler(w http.ResponseWriter, r *http.Request) {
	userId, err := auth.GetUserId(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
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
		    fr.id,               
		    u.id,
		    u.first_name,
		    u.last_name,
		    u.profile_pic
		FROM   follow_requests AS fr
		JOIN   users           AS u ON u.id = fr.follower_id
		WHERE  fr.followed_id = ?
		  AND  fr.status      = 'pending'
		ORDER BY fr.created_at DESC
		LIMIT  ? OFFSET ?;`

	rows, err := tp.DB.Query(selectFollowRequests, id, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var followRequests []ReqUser
	for rows.Next() {
		var followRequest ReqUser

		if err := rows.Scan(&followRequest.FollowID, &followRequest.ID, &followRequest.FirstName, &followRequest.LastName, &followRequest.ProfilePic); err != nil {
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
