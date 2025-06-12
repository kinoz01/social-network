package helpers

import (
	"encoding/json"
	"log"
	"net/http"
)

// Return error response to JS fetches.
func JsonError(w http.ResponseWriter, msg string, statusCode int, err error) {
	// Log the error in case of internal server error.
	if err != nil && statusCode == 500 { //- || statusCode == http.StatusBadRequest
		log.Println(err)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	resp := struct {
		Msg string `json:"msg"`
	}{
		Msg: msg,
	}
	json.NewEncoder(w).Encode(resp)
}
