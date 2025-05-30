package repoPosts

import (
	"database/sql"
	"fmt"
	"social-network/handlers/types"
)

func CreateCommentDB(newComment types.Comment) error {
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

func CommentByPost(postID string, page int) ([]types.Comment, error) {
	var comments []types.Comment
	query := `
	SELECT
		c.comment_id,
		c.user_id,
		c.post_id,
		c.content,
		c.img_comment,
		c.created_at,
		u.first_name,
		u.last_name,
		u.profile_pic
		FROM comments c
		INNER JOIN users u ON u.id = c.user_id
		WHERE c.post_id = ?
		ORDER BY c.created_at DESC, c.ROWID DESC
		LIMIT 20 OFFSET ?
	`
	rows, err := types.DB.Query(query, postID, page)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var comment types.Comment
		var imgComment sql.NullString
		err := rows.Scan(
			&comment.ID,
			&comment.UserID,
			&comment.PostID,
			&comment.Content,
			&imgComment,
			&comment.CreatedAt,
			&comment.FirstName,
			&comment.LastName,
			&comment.Avatar,
		)
		if err != nil {
			return nil, err
		}
		if imgComment.Valid {
			comment.Img_comment = imgComment.String
		} else {
			comment.Img_comment = ""
		}
		comments = append(comments, comment)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return comments, nil
}
