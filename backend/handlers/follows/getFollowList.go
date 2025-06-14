// handlers/follows/get_follows.go
package follows

import (
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)


type FollowsResponse struct {
	FollowList  []tp.User `json:"followList"`
	TotalCount int       `json:"totalCount"`
	TotalPages int       `json:"totalPages"`
}


func GetFollowsHandler(w http.ResponseWriter, r *http.Request) {
	viewerId, err := auth.GetUserId(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	kind := r.URL.Query().Get("kind") // followers | followings
	if kind == "" {
		kind = "followers"
	}

	profileId := r.URL.Query().Get("id")
	if profileId == "" {
		profileId = viewerId
	}

	limitQ := r.URL.Query().Get("limit")
	pageQ := r.URL.Query().Get("page")

	var accountType string
	if err := tp.DB.QueryRow(`SELECT account_type FROM users WHERE id = ?`, profileId).
		Scan(&accountType); err != nil {
		help.JsonError(w, "Unexpected error", http.StatusInternalServerError, err)
		return
	}

	if accountType == "private" && profileId != viewerId {
		var ok bool
		_ = tp.DB.QueryRow(
			`SELECT EXISTS (
			     SELECT 1
			       FROM follow_requests
			      WHERE follower_id = ?
			        AND followed_id = ?
			        AND status = 'accepted'
			 )`, viewerId, profileId).
			Scan(&ok)

		if !ok {
			help.JsonError(w, "private profile", http.StatusPartialContent, nil)
			return
		}
	}

	/* ───── fetch data ───── */
	resp, err := getFollows(profileId, kind, limitQ, pageQ)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	_ = json.NewEncoder(w).Encode(resp)
}


func getFollows(profileId, kind, limitQ, pageQ string) (*FollowsResponse, error) {
	/* ── pagination numbers ── */
	page := 1
	limit := 10

	if pageQ != "" {
		if n, err := strconv.Atoi(pageQ); err == nil && n > 0 {
			page = n
		}
	}
	if limitQ != "" {
		if n, err := strconv.Atoi(limitQ); err == nil && n > 0 {
			limit = n
		}
	}
	offset := (page - 1) * limit

	/* ── total count ── */
	var totalCount int
	var countStmt string

	if kind == "followers" {
		countStmt = `SELECT COUNT(*) FROM follow_requests WHERE followed_id = ? AND status = "accepted"`
	} else {
		countStmt = `SELECT COUNT(*) FROM follow_requests WHERE follower_id = ? AND status = "accepted"`
	}

	if err := tp.DB.QueryRow(countStmt, profileId).Scan(&totalCount); err != nil {
		return nil, err
	}
	totalPages := (totalCount + limit - 1) / limit

	var selectStmt string
	if kind == "followers" {
		selectStmt = `
		    SELECT u.id, u.first_name, u.last_name, u.profile_pic, u.account_type
		      FROM follow_requests fr
		      JOIN users u ON u.id = fr.follower_id
		     WHERE fr.followed_id = ? AND fr.status = "accepted"
		     LIMIT ? OFFSET ?`
	} else {
		selectStmt = `
		    SELECT u.id, u.first_name, u.last_name, u.profile_pic, u.account_type
		      FROM follow_requests fr
		      JOIN users u ON u.id = fr.followed_id
		     WHERE fr.follower_id = ? AND fr.status = "accepted"
		     LIMIT ? OFFSET ?`
	}

	rows, err := tp.DB.Query(selectStmt, profileId, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []tp.User
	for rows.Next() {
		var u tp.User
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.ProfilePic, &u.AccountType); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	/* ── build response ── */
	resp := &FollowsResponse{
		TotalCount: totalCount,
		TotalPages: totalPages,
		FollowList: users,
	}
	return resp, nil
}
