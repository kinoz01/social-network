package repoPosts

import (
	"fmt"

	"social-network/handlers/types"
	pType "social-network/handlers/types"
)

func SavePOstLIke(likeDetails types.React) error {
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

func IsReacted(like types.React) error {
	var idUser, idPost string
	query := `SELECT user_id, post_id FROM like_reaction WHERE user_id=? AND post_id=?`
	rows := pType.DB.QueryRow(query, like.UserID, like.PostID)
	err := rows.Scan(&idUser, &idPost)
	// fmt.Println("heere", idUser, idPost)
	if err != nil {
		return fmt.Errorf("failed to find the reacrion %w", err)
	}
	return nil
}

func DeletePOstLIke(like types.React) error {
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
