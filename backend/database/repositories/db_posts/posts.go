package repoPosts

import (
	"database/sql"
	"fmt"

	pType "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

// insert post into db
func CreatePostDB(newPost pType.Post) error {
	var imgPost sql.NullString
	if newPost.Imag_post != "" {
		imgPost = sql.NullString{
			String: newPost.Imag_post,
			Valid:  true,
		}
	} else {
		imgPost = sql.NullString{
			String: "",
			Valid:  false,
		}
	}
	query := `INSERT INTO posts (post_id, user_id, body, img_post, visibility)
	          VALUES (?, ?, ?, ?, ?)`
	stat, err := pType.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to preparing statement %w", err)
	}
	defer stat.Close()

	_, err = stat.Exec(newPost.ID, newPost.UserID, newPost.Content, imgPost, newPost.Visibility)
	if err != nil {
		return fmt.Errorf("failed to insert new post in database %w", err)
	}
	return nil
}

// insert an allowed vip user for a certain post
func PostPrivacyDB(postID string, userID string) error {
	const query = `INSERT INTO post_privacy (id, post_id, allowed_users)
           VALUES (?, ?, ?)`

	stat, err := pType.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to preparing statement %w", err)
	}
	defer stat.Close()

	_, err = stat.Exec(uuid.Must(uuid.NewV4()), postID, userID)
	if err != nil {
		return fmt.Errorf("failed to insert privacy of post %w", err)
	}
	return nil
}

// Get all posts excluding group posts and private/vip except if user allowed.
func GetAllPOst(offset int, userID string) ([]pType.PostData, error) {
	const q = `
	SELECT
	p.post_id, p.user_id, p.body, p.img_post, u.first_name, u.last_name, u.profile_pic, lr.react_type, p.created_at,
		(SELECT COUNT(*) FROM like_reaction lr2
	    	WHERE lr2.post_id = p.post_id AND lr2.react_type = '1') AS like_count,
		(SELECT COUNT(*) FROM comments c 
			WHERE c.post_id = p.post_id) AS comment_count,
	p.visibility, p.group_id
	FROM posts p
	JOIN users u ON u.id = p.user_id
	LEFT JOIN like_reaction lr
	       ON lr.post_id = p.post_id AND lr.user_id = ?
	WHERE p.group_id IS NULL
	  AND (
	        p.visibility = 'public'
	     	OR p.post_id IN (
	          	SELECT post_id FROM post_privacy WHERE allowed_users = ?
	        )
	     	OR (
	          	p.visibility = 'almost-private'
	      	AND (
	            p.user_id IN (
	                SELECT followed_id
	                  	FROM follow_requests
	                 		WHERE follower_id = ? AND status = 'accepted'
	            )
	            OR p.user_id = ?
	          )
	       )
	  )
	ORDER BY p.created_at DESC, p.ROWID DESC
	LIMIT 20 OFFSET ?;`

	rows, err := pType.DB.Query(q, userID, userID, userID, userID, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPosts(rows)
}

// get all group posts
func GetGroupPOsts(offset int, userID, groupID string) ([]pType.PostData, error) {
	const q = `
		SELECT
		    p.post_id, p.user_id, p.body, p.img_post, u.first_name, u.last_name, u.profile_pic, lr.react_type, p.created_at,
		    (
		        SELECT COUNT(*)					-- likes counter
		        FROM like_reaction lr2
		        WHERE lr2.post_id = p.post_id
		        AND lr2.react_type = '1' 
		    ),
		    (
		        SELECT COUNT(*)					-- comments counter
		        FROM comments c
		        WHERE c.post_id = p.post_id
		    ),
		    p.visibility,
		    p.group_id
		FROM posts p
		JOIN users u						   -- rows that match between posts and users
		ON u.id = p.user_id 				   
		LEFT JOIN like_reaction lr			   -- all rows from the left, and match rows from the right table (no match -> NULL)
		  ON lr.post_id = p.post_id
		 AND lr.user_id = ?
		WHERE p.group_id = ?
		  AND p.visibility = 'public'
		ORDER BY p.created_at DESC, p.ROWID DESC
		LIMIT 20
		OFFSET ?;`

	rows, err := pType.DB.Query(q, userID, groupID, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanPosts(rows)
}

func scanPosts(rows *sql.Rows) ([]pType.PostData, error) {
	var posts []pType.PostData
	for rows.Next() {
		var p pType.PostData
		var img sql.NullString
		var react sql.NullString
		var groupID sql.NullString
		if err := rows.Scan(
			&p.PostID,
			&p.UserID,
			&p.Content,
			&img,
			&p.FirstName,
			&p.LastName,
			&p.ProfilePic,
			&react,
			&p.CreatedAt,
			&p.TotalLIKes,
			&p.TotalComments,
			&p.Visibility,
			&groupID,
		); err != nil {
			return nil, err
		}
		if img.Valid {
			p.Imag_post = img.String
		}
		if react.Valid {
			p.HasReact = react.String
		}
		if groupID.Valid {
			p.GroupID = groupID.String
		}

		posts = append(posts, p)
	}
	return posts, rows.Err()
}
