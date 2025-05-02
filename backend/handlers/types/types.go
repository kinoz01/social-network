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

type Group struct {
	ID          string `json:"id"`
	GroupName   string `json:"group_name"`
	GroupOwner  string `json:"group_owner"`
	GroupPic    string `json:"group_pic"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	Request     string `json:"request"`
	Members     int    `json:"members"`
}
