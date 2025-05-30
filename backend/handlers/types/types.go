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

type Users struct {
	Users []User
}

type Post struct {
	ID         string   `json:"id"`
	UserID     string   `json:"userID"`
	Content    string   `json:"content"`
	Imag_post  string   `json:"imag_post,omitempty"`
	Visibility string   `json:"visibility"`
	VipUsers   []string `json:"vipUsers"`
	CreatedAt  string   `json:"createdAt"`
}

type PostData struct {
	PostID        string   `json:"id"`
	UserID        string   `json:"userID"`
	Content       string   `json:"content"`
	Imag_post     string   `json:"imag_post,omitempty"`
	Visibility    string   `json:"visibility"`
	VipUsers      []string `json:"vipUsers"`
	FirstName     string   `json:"firstName"`
	LastName      string   `json:"lastName"`
	ProfilePic    string   `json:"profile_pic"`
	HasReact      string   `json:"hasReact"`
	TotalLIKes    int      `json:"totalLikes"`
	TotalComments int      `json:"totalComments"`
	CreatedAt     string   `json:"createdAt"`
	GroupID       string   `json:"groupID,omitempty"`
}

type React struct {
	ID        string
	UserID    string `json:"userID"`
	PostID    string `json:"postID,omitempty"`
	CommentID string `json:"commentID,omitempty"`
	ISLike    string `json:"IsLike"`
}

type Comment struct {
	ID          string `json:"commentId"`
	Content     string `json:"content"`
	UserID      string `json:"userID"`
	Img_comment string `json:"img_comment,omitempty"`
	PostID      string `json:"postID"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Avatar      string `json:"avatar"`
	CreatedAt   string `json:"createdAt"`
}

type Group struct {
	ID          string `json:"id"`
	GroupName   string `json:"group_name"`
	GroupOwner  string `json:"group_owner"`
	GroupPic    string `json:"group_pic"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	Request     string `json:"request"` // pending toggle when rendering all groups
	Members     int    `json:"members"`
}
