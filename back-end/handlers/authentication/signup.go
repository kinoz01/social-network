package auth

import (
	"fmt"
	"io"
	"net/http"
	"regexp"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"golang.org/x/crypto/bcrypt"
)

const (
	maxEmailSize    = 200
	maxUsernameSize = 50
	maxNameSize     = 50
	maxPasswordSize = 100
	maxPicSize      = 1 << 20 // 1 MB for profile pic
	maxAboutMeSize  = 1000
	maxDateSize     = 20
)

// Signing up a new user.
func SignUpHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	mr, err := r.MultipartReader()
	if err != nil {
		help.JsonError(w, "Invalid form submission", http.StatusBadRequest, err)
		return
	}

	var (
		email, username, password, firstName, lastName, birthday, aboutMe string
		profilePic                                                        []byte
	)

	fields := map[string]struct {
		maxSize  int
		target   *string
		errorMsg string
	}{
		"email":      {maxEmailSize, &email, "Email is too long"},
		"username":   {maxUsernameSize, &username, "Username is too long"},
		"password":   {maxPasswordSize, &password, "Password is too long"},
		"first_name": {maxNameSize, &firstName, "First name is too long"},
		"last_name":  {maxNameSize, &lastName, "Last name is too long"},
		"birthday":   {maxDateSize, &birthday, "Birthday is too large or invalid"},
		"about_me":   {maxAboutMeSize, &aboutMe, "AboutMe too long"},
	}

	// Process each form part
	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			help.JsonError(w, "Error reading form data", http.StatusInternalServerError, err)
			return
		}

		fieldName := part.FormName()

		// Handle profile_pic separately
		if fieldName == "profile_pic" {
			contentType := part.Header.Get("Content-Type")
			if len(contentType) < 6 || contentType[:6] != "image/" {
				help.JsonError(w, "Invalid image content type", http.StatusBadRequest, fmt.Errorf("content type: %s", contentType))
				return
			}
			profilePic, err = help.LimitRead(part, maxPicSize)
			if err != nil {
				help.JsonError(w, "Profile picture too large (1 MB max)", http.StatusBadRequest, err)
				return
			}
			continue
		}

		// Handle other fields using the spec map
		spec, exists := fields[fieldName]
		if !exists {
			continue // Ignore unknown fields
		}

		b, err := help.LimitRead(part, spec.maxSize)
		if err != nil {
			help.JsonError(w, spec.errorMsg, http.StatusBadRequest, err)
			return
		}
		*spec.target = string(b)
	}

	// Build user struct
	user := tp.User{
		Email:     email,
		Username:  username,
		Password:  password,
		FirstName: firstName,
		LastName:  lastName,
		Bday:      birthday,
		AboutMe:   aboutMe,
	}

	// Validate fields
	if err := ValidateSignUp(user); err != nil {
		help.JsonError(w, err.Error(), http.StatusNotAcceptable, err)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		help.JsonError(w, "unexpected error, try again later", http.StatusInternalServerError, err)
		return
	}

	// Save optional profile pic
	profilePicPath := "avatar.webp"
	if len(profilePic) > 0 {
		if help.IsSVG(profilePic) {
			help.JsonError(w, "svg images aren't supported", http.StatusUnauthorized, nil)
			return
		}
		profilePicPath, err = help.SaveImg(profilePic)
		if err != nil {
			help.JsonError(w, "Failed to save profile image", http.StatusInternalServerError, err)
			return
		}
	}

	// Insert user
	insertUser := `
	INSERT INTO users (email, username, password, first_name, last_name, birthday, about_me, profile_pic)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err = tp.DB.Exec(insertUser, user.Email, user.Username, hashedPassword, user.FirstName, user.LastName, user.Bday, user.AboutMe, profilePicPath)
	if err != nil {
		help.JsonError(w, "unexpected error, try again later", http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("User created successfully"))
}

// Validate signup payload.
func ValidateSignUp(user tp.User) error {
	if user.Email == "" || user.Password == "" || user.FirstName == "" || user.LastName == "" {
		return fmt.Errorf("missing fields")
	}

	// Validate Email
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,20}$`
	if match, _ := regexp.MatchString(emailRegex, user.Email); !match {
		return fmt.Errorf("invalid email format")
	}
	if len(user.Email) > 200 {
		return fmt.Errorf("email is too long")
	}

	// Validate Username
	if user.Username != "" {
		if len(user.Username) < 3 {
			return fmt.Errorf("username is too short")
		}
		if len(user.Username) > 16 {
			return fmt.Errorf("username is too long")
		}
		usernameRegex := `^[a-zA-Z0-9_.-]+$`
		if match, _ := regexp.MatchString(usernameRegex, user.Username); !match {
			return fmt.Errorf("username can only contain letters, digits, underscores, dots, and hyphens")
		}
	}

	// Validate First Name & Last Name
	nameRegex := `^[a-zA-Z]+$`
	if !regexp.MustCompile(nameRegex).MatchString(user.FirstName) {
		return fmt.Errorf("invalid first name")
	}
	if len(user.FirstName) < 3 {
		return fmt.Errorf("first name is too short")
	}
	if len(user.FirstName) > 25 {
		return fmt.Errorf("first name is too long")
	}
	if len(user.LastName) < 3 {
		return fmt.Errorf("last name is too short")
	}
	if len(user.LastName) > 25 {
		return fmt.Errorf("last name is too long")
	}
	if !regexp.MustCompile(nameRegex).MatchString(user.LastName) {
		return fmt.Errorf("last name must contain only letters (A-Z, a-z)")
	}

	// Validate Password
	if len(user.Password) < 6 {
		return fmt.Errorf("password is too short")
	}
	if len(user.Password) > 64 {
		return fmt.Errorf("password is too long")
	}
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(user.Password)
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(user.Password)
	hasDigit := regexp.MustCompile(`\d`).MatchString(user.Password)
	hasSpecial := regexp.MustCompile(`[\W_]`).MatchString(user.Password)
	if !hasLower || !hasUpper || !hasDigit || !hasSpecial {
		return fmt.Errorf("password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character")
	}

	// Check if email/username already exists
	exists := false
	err := tp.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = ? OR username = ?)`, user.Email, user.Username).Scan(&exists)
	if err != nil {
		return fmt.Errorf("unexpected error, try again later")
	}
	if exists {
		return fmt.Errorf("email or username already exists")
	}

	return nil
}
