package repoPosts

import (
	"database/sql"
	"fmt"
	"social-network/handlers/types"
)

func CreateCommentDB(newComment types.Comment) error {
	// fmt.Println("before dqtqBQSE", newComment)
	var imgComment sql.NullString
	if newComment.Img_comment != "" {
		imgComment = sql.NullString{
			String: newComment.Img_comment,
			Valid:  true,
		}
	} else {
		imgComment = sql.NullString{
			String: "",
			Valid:  false,
		}
	}
	query := `INSERT INTO comments (comment_id, user_id, post_id, content, img_comment)
	          VALUES (?, ?, ?, ?, ?)`
	stat, err := types.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to preparing statement %w", err)
	}
	defer stat.Close()
	_, err = stat.Exec(newComment.ID, newComment.UserID, newComment.PostID, newComment.Content, imgComment)
	if err != nil {
		return fmt.Errorf("failed to insert new comment in database %w", err)
	}
	return nil
}
