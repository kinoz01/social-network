package posts

import (
	"encoding/json"
	"net/http"

	postDB "social-network/database/repositories/db_posts"

	help "social-network/handlers/helpers"
	"social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func HandleLike(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}
	var Like types.React

	err := json.NewDecoder(r.Body).Decode(&Like)
	if err != nil {
		help.JsonError(w, "bad request", http.StatusBadRequest, nil)
		return
	}
	defer r.Body.Close()
	reactID := uuid.Must(uuid.NewV4())
	Like.ID = reactID.String()

	if err := postDB.IsReacted(Like); err != nil {
		if err := postDB.SavePOstLIke(Like); err != nil {
			help.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
			return
		}
	} else {
		if err := postDB.DeletePOstLIke(Like); err != nil {
			help.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
			return
		}
	}
}
