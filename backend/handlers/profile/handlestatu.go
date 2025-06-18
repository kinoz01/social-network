package profile

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	Error "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// type Resp struct {
// 	AccountType string `json:"account_type"`
// }

// func ChangeStatu(w http.ResponseWriter, r *http.Request) {
// 	userID, err := auth.GetUserId(r)
// 	if err != nil {
// 		Error.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
// 		return
// 	}

// 	var curr string
// 	if err := tp.DB.QueryRow(`SELECT account_type FROM users WHERE id = ?`, userID).
// 		Scan(&curr); err != nil {
// 		Error.JsonError(w, "db error", http.StatusInternalServerError, err)
// 		return
// 	}

// 	newStatus := "private"

// 	if curr == "private" {
// 		newStatus = "public"

// 		if _, err := tp.DB.Exec(`
// 				UPDATE follow_requests
// 				   SET status = 'accepted'
// 				 WHERE followed_id = ? AND status = 'pending'`,
// 			userID,
// 		); err != nil {
// 			Error.JsonError(w, "db error", http.StatusInternalServerError, err)
// 			return
// 		}

// 		if _, err := tp.DB.Exec(`
// 				DELETE FROM notifications
// 				 WHERE receiver_id = ?
// 				   AND type = 'follow_request'
// 				   AND related_follow_id IN (
// 					   SELECT id
// 						 FROM follow_requests
// 						WHERE followed_id = ?
// 				   )`,
// 			userID, userID,
// 		); err != nil {
// 			Error.JsonError(w, "db error", http.StatusInternalServerError, err)
// 			return
// 		}
// 	}

// 	if _, err := tp.DB.Exec(`
// 		UPDATE users
// 		   SET account_type = ?
// 		 WHERE id = ?`, newStatus, userID); err != nil {
// 		Error.JsonError(w, "db error", http.StatusInternalServerError, err)
// 		return
// 	}

// 	/* JSON reply for the React code */
// 	w.Header().Set("Content-Type", "application/json")
// 	_ = json.NewEncoder(w).Encode(Resp{AccountType: newStatus})
// }

type AccountStatus struct {
	Stauts string `json:"status"`
}

func ChangeStatu(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		Error.JsonError(w, "Method not allowed", 405, nil)
		return
	}

	useid := strings.Split(r.URL.Path, "/")[3]
	fmt.Println("rrrrry", useid)
	var status AccountStatus
	err := json.NewDecoder(r.Body).Decode(&status)
	if err != nil {
		Error.JsonError(w, "Error decoding JSON", http.StatusBadRequest, nil)
		return
	}
	defer r.Body.Close()
	fmt.Println("u", status.Stauts)
	msg, err := UpDateStatus(w, status.Stauts, useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	fmt.Println("msg", msg)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msg)
}

func UpDateStatus(w http.ResponseWriter, status string, useid string) (msg string, err error) {
	fmt.Println("id ldakhal", useid)
	fmt.Println("status ldakhal", status)
	sqlStatement := `
UPDATE users
SET account_type = ?
WHERE id =?;
	`
	_, err = tp.DB.Exec(sqlStatement, status, useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return "", err
	}
	fmt.Println("")
	return `update account_type successfully`, nil
}
