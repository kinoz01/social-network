package comments

import (
	"net/http"
	"social-network/handlers/helpers"
)

func GetComments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}
}
