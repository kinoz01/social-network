package types

import (
	"database/sql"
	"time"

	"github.com/gofrs/uuid"
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
type Users struct {
	Users []User
}

type Post struct {
	ID         string         `json:"id"`
	UserID     string         `json:"userID"`
	Content    string         `json:"content"`
	Imag_post  sql.NullString `json:"imag_post"`
	Visibility string         `json:"visibility"`
	VipUsers   []string       `json:"vipUsers"`
}

// type

type PostData struct {
	PostID     string         `json:"id"`
	UserID     string         `json:"userID"`
	Content    string         `json:"content"`
	Imag_post  sql.NullString `json:"imag_post"`
	Visibility string         `json:"visibility"`
	VipUsers   []string       `json:"vipUsers"`
	FirstName  string         `json:"firstName"`
	LastName   string         `json:"lastName"`
	ProfilePic string         `json:"profile_pic"`
	CreatedAt  string         `json:"createdAt"`
}

type Comment struct {
	ID          uuid.UUID `json:"id,omitempty"`
	Firstname   string    `json:"first_name"`
	Lastname    string    `json:"lastname"`
	Profile_pic string    `json:"profile_pic"`
	Postid      string    `json:"postid,omitempty"`
	Content     string    `json:"content"`
	Userid      string    `json:"userid,omitempty"`
	Creatat     time.Time `json:"creatat,omitempty"`
}

type Errorcomment struct {
	Content string `json:"content"`
}
