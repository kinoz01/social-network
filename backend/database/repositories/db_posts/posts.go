package repoPosts

import (
	"database/sql"
	"fmt"

	pType "social-network/handlers/types"
)

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

func PostPrivacyDB(postID string, userID string) error {
	query := `INSERT INTO post_privacy (post_id, allowed_users) VALUES
				(?, ?)`
	stat, err := pType.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to preparing statement %w", err)
	}
	defer stat.Close()

	_, err = stat.Exec(postID, userID)
	if err != nil {
		return fmt.Errorf("failed to insert privacy of post %w", err)
	}
	return nil
}

func GetAllPOst(currentPage int, userID string) ([]pType.PostData, error) {
	query := `SELECT DISTINCT
	            p.post_id AS id,
	            p.user_id AS userID,
		        p.body AS content,
		        p.img_post AS imag_post,
		        p.visibility,
		        u.first_name AS firstName,
		        u.last_name AS lastName,
		        u.profile_pic,
		        l.react_type,
		        p.created_at,
			(SELECT COUNT(*) 
              	FROM like_reaction lr 
              	WHERE lr.post_id = p.post_id AND lr.react_type = '1') AS like_count,
			(SELECT COUNT(*) 
              	FROM comments c 
               	WHERE c.post_id = p.post_id) AS comment_count
	        FROM
		        posts p
		        INNER JOIN users u ON u.id = p.user_id
		        LEFT JOIN like_reaction l ON l.post_id = p.post_id AND l.user_id = ?
	        WHERE p.group_id IS NULL
			AND (
		        p.visibility = "public"
		        OR p.post_id IN (
			        SELECT
				        post_id
			        FROM
				        post_privacy
			        WHERE
				        post_privacy.allowed_users = ?
		        	)
				)
	        ORDER BY
		         p.created_at DESC
			     LIMIT 20 OFFSET ?`
	rows, err := pType.DB.Query(query, userID, userID, currentPage)
	if err != nil {
		return []pType.PostData{}, err
	}
	defer rows.Close()
	var posts []pType.PostData
	for rows.Next() {
		var post pType.PostData
		var imgPost sql.NullString
		var react sql.NullString
		err := rows.Scan(
			&post.PostID,
			&post.UserID,
			&post.Content,
			&imgPost,
			&post.Visibility,
			&post.FirstName,
			&post.LastName,
			&post.ProfilePic,
			&react,
			&post.CreatedAt,
			&post.TotalLIKes,
			&post.TotalComments,
		)
		if err != nil {
			return []pType.PostData{}, err
		}
		if imgPost.Valid {
			post.Imag_post = imgPost.String
		} else {
			post.Imag_post = ""
		}
		if react.Valid {
			post.HasReact = react.String
		} else {
			post.HasReact = ""
		}
		posts = append(posts, post)
	}
	if err = rows.Err(); err != nil {
		return []pType.PostData{}, err
	}
	return posts, nil
}
