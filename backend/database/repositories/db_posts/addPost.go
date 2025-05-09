package repoPosts

import (
	"fmt"

	pType "social-network/handlers/types"
)

func CreatePostDB(newPost pType.Post) error {
	fmt.Println("before dqtqBQSE", newPost)
	query := `INSERT INTO posts (post_id, user_id, body, img_post, visibility)
	          VALUES (?, ?, ?, ?, ?)`
	stat, err := pType.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to preparing statement %w", err)
	}
	_, err = stat.Exec(newPost.ID, newPost.UserID, newPost.Content, newPost.Imag_post, newPost.Visibility)
	if err != nil {
		return fmt.Errorf("failed to insert new post in database %w", err)
	}
	return nil
}
