package profile

import (
	"encoding/json"
	"fmt"
	"net/http"
	Error "social-network/handlers/helpers"
	tp "social-network/handlers/types"
	"strings"
)

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
	_, err = tp.DB.Exec(sqlStatement, status , useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return "", err
	}
	fmt.Println("")
	return `update account_type successfully`, nil
}
