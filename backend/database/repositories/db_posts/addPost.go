package repoPosts

import (
	"fmt"

	pType "social-network/handlers/types"
)

func CreatePostDB(newPost pType.Post) error {
	// fmt.Println("before dqtqBQSE", newPost)
	query := `INSERT INTO posts (post_id, user_id, body, img_post, visibility)
	          VALUES (?, ?, ?, ?, ?)`
	stat, err := pType.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to preparing statement %w", err)
	}
	defer stat.Close()
	_, err = stat.Exec(newPost.ID, newPost.UserID, newPost.Content, newPost.Imag_post, newPost.Visibility)
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

func GetAllPOst(currentPage int) ([]pType.PostData, error) {
	query :=
		`SELECT 
        p.post_id AS id,
        p.user_id AS userID,
		p.body AS content,
		p.img_post AS imag_post,
		p.visibility,
		u.first_name AS firstName,
		u.last_name AS lastName,
		u.profile_pic,
		datetime(p.created_at) AS createdAt
	FROM 
   		posts p
	JOIN 
    	users u ON p.user_id = u.id
	ORDER BY 
    	p.created_at DESC
	LIMIT 2 OFFSET ?`
	rows, err := pType.DB.Query(query, currentPage)
	if err != nil {
		return []pType.PostData{}, err
	}
	defer rows.Close()
	var posts []pType.PostData
	for rows.Next() {
		var post pType.PostData
		err := rows.Scan(
			&post.PostID,
			&post.UserID,
			&post.Content,
			&post.Imag_post,
			&post.Visibility,
			&post.FirstName,
			&post.LastName,
			&post.ProfilePic,
			&post.CreatedAt,
		)
		if err != nil {
			return []pType.PostData{}, err
		}
		posts = append(posts, post)
	}
	if err = rows.Err(); err != nil {
		return []pType.PostData{}, err
	}
	return posts, nil
}
