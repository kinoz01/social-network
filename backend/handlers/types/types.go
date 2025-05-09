package types

import (
	"database/sql"
)

var DB *sql.DB

type User struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Bday        string `json:"birthday"`
	ProfilePic  string `json:"profile_pic"`
	AboutMe     string `json:"about_me"`
	AccountType string `json:"account_type"`
}

type Post struct {
	ID         string `json:"id"`
	UserID     string
	Content    string         `json:"content"`
	Imag_post  sql.NullString `json:"imag_post"`
	Visibility string         `json:"visibility"`
	VipUsers   []string       `json:"vipUsers"`
}
