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

func GetGroupPOsts(offset int, userID, groupID string) ([]pType.PostData, error) {
	const q = `
		SELECT
		    p.post_id, p.user_id, p.body, p.img_post, u.first_name, u.last_name, u.profile_pic, lr.react_type, p.created_at,
		    (
		        SELECT COUNT(*)
		        FROM like_reaction lr2
		        WHERE lr2.post_id = p.post_id
		        AND lr2.react_type = '1'
		    ),
		    (
		        SELECT COUNT(*)
		        FROM comments c
		        WHERE c.post_id = p.post_id
		    ),
		    p.visibility,
		    p.group_id
		FROM posts p
		JOIN users u
		  ON u.id = p.user_id
		LEFT JOIN like_reaction lr
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

func GetProfilePosts(offset int, userID, profileID string) ([]pType.PostData, error) {
	// self-view: everything
	if userID == profileID {
		rows, err := pType.DB.Query(`
			SELECT
			  p.post_id, p.user_id, p.body, p.img_post,
			  u.first_name, u.last_name, u.profile_pic,
			  lr.react_type, p.created_at,
			  (SELECT COUNT(*) FROM like_reaction lr2
			     WHERE lr2.post_id=p.post_id AND lr2.react_type='1'),
			  (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.post_id),
			  p.visibility, p.group_id
			FROM posts p
			JOIN users u ON u.id = p.user_id
			LEFT JOIN like_reaction lr
			       ON lr.post_id = p.post_id AND lr.user_id = ?
			WHERE p.user_id = ?
			ORDER BY p.created_at DESC, p.ROWID DESC
			LIMIT 20 OFFSET ?;`, userID, profileID, offset)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanPosts(rows)
	}

	// relation check
	var accountType string
	if err := pType.DB.QueryRow(`SELECT account_type FROM users WHERE id = ?`, profileID).
		Scan(&accountType); err != nil {
		return nil, err
	}

	var related bool
	_ = pType.DB.QueryRow(`
		SELECT EXISTS(
		  SELECT 1 FROM follow_requests
		   WHERE status='accepted'
		     AND ((follower_id=? AND followed_id=?)
		       OR (follower_id=? AND followed_id=?))
		);`, userID, profileID, profileID, userID).Scan(&related)

	if !related && accountType == "private" {
		return nil, fmt.Errorf("no content")
	}

	// groups shared
	var shareGroup bool
	_ = pType.DB.QueryRow(`
		SELECT EXISTS(
		  SELECT 1
		    FROM group_users a
		    JOIN group_users b ON a.group_id = b.group_id
		   WHERE a.users_id = ? AND b.users_id = ?
		);`, userID, profileID).Scan(&shareGroup)

	visCond := "p.visibility='public'"
	args := []any{userID, userID, profileID}

	if related {
		visCond = `
			(p.visibility IN ('public','almost-private')
  			OR (
    		   p.visibility='private'
   			AND EXISTS(SELECT 1
    		        FROM post_privacy
    		           WHERE post_id = p.post_id
    		        AND allowed_users = ?)
  			))`
		args = append(args, userID)
	}

	groupCond := ""
	if shareGroup {
		groupCond = `
			OR (
			    p.group_id IS NOT NULL
			AND EXISTS (
			    SELECT 1
			        FROM group_users g1
			        JOIN group_users g2 ON g1.group_id = g2.group_id
			    WHERE g1.users_id = ?
			        AND g2.users_id = ?
			        AND g1.group_id = p.group_id
			    )
			)`
		args = append(args, userID, profileID)
	}

	// final query
	query := fmt.Sprintf(`
		SELECT
		  	p.post_id, p.user_id, p.body, p.img_post,
		  	u.first_name, u.last_name, u.profile_pic,
		  	lr.react_type, p.created_at,
		  	(SELECT COUNT(*) FROM like_reaction lr2
		     	WHERE lr2.post_id=p.post_id AND lr2.react_type='1'),
		  	(SELECT COUNT(*) FROM comments c WHERE c.post_id=p.post_id),
		p.visibility, p.group_id
		FROM posts p
		JOIN users u ON u.id = p.user_id
		LEFT JOIN like_reaction lr
		    ON lr.post_id = p.post_id AND lr.user_id = ?
		WHERE p.user_id = ?
		  	AND (%s%s )  
		ORDER BY p.created_at DESC, p.ROWID DESC
		LIMIT 20 OFFSET %d;`,
		visCond, groupCond, offset)

	rows, err := pType.DB.Query(query, args...)
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
