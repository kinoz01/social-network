package repoPosts

import (
	"database/sql"
	"fmt"

	pType "social-network/handlers/types"
)

func SavePOstLIke(likeDetails pType.React) error {
	// fmt.Println("details ", likeDetails)
	query := `INSERT INTO like_reaction (id, user_id, post_id, react_type) VALUES (?, ?, ?, ?)`
	stat, err := pType.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to preparing statement %w", err)
	}
	defer stat.Close()
	_, err = stat.Exec(likeDetails.ID, likeDetails.UserID, likeDetails.PostID, likeDetails.ISLike)
	if err != nil {
		return fmt.Errorf("failed to insert new react in database %w", err)
	}
	return nil
}

func IsReacted(like pType.React) error {
	var idUser, idPost string
	query := `SELECT user_id, post_id FROM like_reaction WHERE user_id=? AND post_id=?`
	rows := pType.DB.QueryRow(query, like.UserID, like.PostID)
	err := rows.Scan(&idUser, &idPost)
	if err != nil {
		return fmt.Errorf("failed to find the reacrion %w", err)
	}
	return nil
}

func DeletePOstLIke(like pType.React) error {
	query := `DELETE FROM like_reaction WHERE user_id = ? AND post_id = ?`
	stat, err := pType.DB.Prepare(query)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stat.Close()

	_, err = stat.Exec(like.UserID, like.PostID)
	if err != nil {
		return fmt.Errorf("failed to delete the recat: %w", err)
	}

	return nil
}

/************************* COMMENTS REACTIONS ***********************/
func ToggleCommentLike(like pType.React) (liked bool, count int, err error) {
	// try insert → on conflict delete
	ins := `INSERT INTO like_reaction(id, user_id, comment_id, react_type)
	        VALUES (?, ?, ?, ?)
	        ON CONFLICT(user_id, comment_id) DO DELETE`
	res, err := pType.DB.Exec(ins, like.ID, like.UserID, like.CommentID, like.ISLike)
	if err != nil {
		return
	}
	aff, _ := res.RowsAffected()
	liked = aff == 1 // if inserted => now liked, if deleted => unliked

	// fresh count
	err = pType.DB.QueryRow(
		`SELECT COUNT(*) FROM like_reaction WHERE comment_id = ? AND react_type = '1'`,
		like.CommentID).Scan(&count)
	return
}

func IsCommentReacted(l pType.React) error {
	var uid, cid string
	err := pType.DB.QueryRow(`
	    SELECT user_id, comment_id
	    FROM like_reaction
	    WHERE user_id = ? AND comment_id = ?`,
		l.UserID, l.CommentID).Scan(&uid, &cid)
	if err == sql.ErrNoRows {
		return fmt.Errorf("no like") //  treated as “not yet reacted”
	}
	return err // nil means it *is* reacted
}

func SaveCommentLike(l pType.React) error {
	_, err := pType.DB.Exec(`
	  INSERT INTO like_reaction(id, user_id, comment_id, react_type)
	  VALUES (?, ?, ?, ?)`,
		l.ID, l.UserID, l.CommentID, l.ISLike)
	return err
}

func DeleteCommentLike(l pType.React) error {
	_, err := pType.DB.Exec(`
	  DELETE FROM like_reaction
	  WHERE user_id = ? AND comment_id = ?`,
		l.UserID, l.CommentID)
	return err
}

func CountCommentLikes(cid string) (int, error) {
	var n int
	err := pType.DB.QueryRow(
	    `SELECT COUNT(*) FROM like_reaction
	      WHERE comment_id=? AND react_type='1'`, cid).Scan(&n)
	return n, err
}