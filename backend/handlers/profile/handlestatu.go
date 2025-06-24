package profile

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	Error "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type AccountStatus struct {
	Stauts string `json:"status"`
}

func ChangeStatu(w http.ResponseWriter, r *http.Request) {
	
	useid := strings.Split(r.URL.Path, "/")[3]
	var status AccountStatus
	err := json.NewDecoder(r.Body).Decode(&status)
	if err != nil {
		Error.JsonError(w, "Error decoding JSON", http.StatusBadRequest, nil)
		return
	}
	defer r.Body.Close()
	msg, err := UpDateStatus(w, status.Stauts, useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(msg)
}

func UpDateStatus(w http.ResponseWriter, status string, useid string) (msg string, err error) {
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
	return `update account_type successfully`, nil
}
