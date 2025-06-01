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

func CommentByPost(postID string, page int, viewerID string) ([]types.Comment, error) {
	var out []types.Comment
	rows, err := types.DB.Query(`
	  SELECT
	    c.comment_id, c.user_id, c.post_id, c.content, c.img_comment,
	    c.created_at, u.first_name, u.last_name, u.profile_pic,
	    (SELECT COUNT(*) FROM like_reaction lr
	       WHERE lr.comment_id = c.comment_id AND lr.react_type='1')         AS likes,
	    COALESCE((
	      SELECT lr.react_type FROM like_reaction lr
	       WHERE lr.comment_id = c.comment_id AND lr.user_id = ? LIMIT 1),''
	    ) AS reacted
	  FROM comments c
	  JOIN users u ON u.id = c.user_id
	  WHERE c.post_id = ?
	  ORDER BY c.created_at DESC, c.ROWID DESC
	  LIMIT 20 OFFSET ?`, viewerID, postID, page)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c types.Comment
		var img sql.NullString
		if err := rows.Scan(
			&c.ID, &c.UserID, &c.PostID, &c.Content, &img, &c.CreatedAt,
			&c.FirstName, &c.LastName, &c.Avatar, &c.LikesCount, &c.HasReact); err != nil {
			return nil, err
		}
		if img.Valid {
			c.Img_comment = img.String
		}
		out = append(out, c)
	}
	return out, rows.Err()
}
