package types

import (
	"database/sql"
	"time"
)

var DB *sql.DB

type User struct {
	ID         int       `json:"id"`
	Email      string    `json:"email"`
	Username   string    `json:"username"`
	Password   string    `json:"password"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Bday       time.Time `json:"birthday"` // string maybe
	Gender     string    `json:"gender"`
	ProfilePic string    `json:"profile_pic"`
	AboutMe    string    `json:"about_me"`
}
