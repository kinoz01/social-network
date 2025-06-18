package groups

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"

	auth "social-network/handlers/authentication"
	grpInvite "social-network/handlers/groups/invitations"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

// Handle the creation of a new group.
func CreateGroup(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB
		help.JsonError(w, "Invalid form submission", http.StatusBadRequest, err)
		return
	}

	groupName := strings.TrimSpace(r.FormValue("group_name"))
	description := strings.TrimSpace(r.FormValue("description"))

	err = ValidatePayload(groupName, description)
	if err != nil {
		help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}

	/* ---------- invitations ---------- */
	groupID := uuid.Must(uuid.NewV4()).String()
	invitees := r.FormValue("invitee_ids")
	var ids []string
	if err := json.Unmarshal([]byte(invitees), &ids); err != nil {
		help.JsonError(w, "Invalid invitee_ids", 400, err)
		return
	}
	if len(ids) > 0 {
		if err := grpInvite.Invite(groupID, *user, ids); err != nil {
			help.JsonError(w, err.Error(), http.StatusBadRequest, err)
			return
		}
	}

	/* ---------- Save group image ---------- */
	var picPath string
	if file, hdr, _ := r.FormFile("group_pic"); file != nil {
		defer file.Close()
		buff, err := help.LimitRead(file, 2<<20) // 2 MB
		if err != nil {
			help.JsonError(w, "Group picture too large", http.StatusBadRequest, err)
			return
		}
		ext := strings.ToLower(filepath.Ext(hdr.Filename))
		if ext != ".jpg" && ext != ".png" && ext != ".webp" && ext != ".jpeg" && ext != ".gif" {
			help.JsonError(w, "unsupported image format", http.StatusBadRequest, nil)
			return
		}
		picPath, err = help.SaveImg(buff, "groups_avatars/")
		if err != nil {
			help.JsonError(w, "Failed to save picture", http.StatusInternalServerError, err)
			return
		}
	}

	/* ---------- create group ---------- */
	_, err = tp.DB.Exec(`
		INSERT INTO groups (id, group_name, group_owner, description, group_pic)
		VALUES (?,?,?,?,?)`,
		groupID, groupName, user.ID, description, picPath)
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}
	/* ---------- add owner as group member ---------- */
	_, err = tp.DB.Exec(`
	INSERT INTO group_users (id, group_id, users_id)
	VALUES (?, ?, ?)`,
		uuid.Must(uuid.NewV4()).String(), groupID, user.ID)
	if err != nil {
		help.JsonError(w, "Failed to add owner as group member", http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"id":"%s"}`, groupID)
}

// Checks if the group name and description are valid.
func ValidatePayload(groupName string, description string) error {
	validInputRegex := regexp.MustCompile(`^[\p{L}\p{N}\s.,!?'_@\-\(\)]+$`)
	exists := false
	err := tp.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM groups WHERE group_name = ?)`, groupName).Scan(&exists)
	if err != nil {
		return fmt.Errorf("unexpected error, try again later")
	}
	if exists {
		return fmt.Errorf("group name already exists")
	}
	if groupName == "" {
		return fmt.Errorf("group name required")
	}
	if description == "" {
		return fmt.Errorf("description required")
	}
	if len(groupName) > 40 {
		return fmt.Errorf("group name too long")
	}
	if len(description) > 150 {
		return fmt.Errorf("description too long")
	}
	if len(groupName) < 3 {
		return fmt.Errorf("group name too short")
	}
	if len(description) < 4 {
		return fmt.Errorf("description too short")
	}
	if !validInputRegex.MatchString(groupName) {
		return fmt.Errorf("invalid group name")
	}
	if !validInputRegex.MatchString(description) {
		return fmt.Errorf("invalid description")
	}
	return nil
}
