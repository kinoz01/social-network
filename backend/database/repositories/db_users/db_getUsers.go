package repoUsers

import "social-network/handlers/types"

func GetAllUsers() (types.Users, error) {
	query := `SELECT id, email, username, password, first_name, last_name, 
	          birthday, profile_pic, account_type FROM users`
	rows, err := types.DB.Query(query)
	if err != nil {
		return types.Users{}, err
	}
	defer rows.Close()
	var usersList types.Users
	for rows.Next() {
		var user types.User
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Username,
			&user.Password,
			&user.FirstName,
			&user.LastName,
			&user.Bday,
			&user.ProfilePic,
			&user.AccountType,
		)
		if err != nil {
			return types.Users{}, err
		}
		usersList.Users = append(usersList.Users, user)
	}
	if err = rows.Err(); err != nil {
		return types.Users{}, err
	}

	return usersList, nil
}
