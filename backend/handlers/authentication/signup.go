package auth

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"time"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"
)

const (
	maxEmailSize    = 30
	maxUsernameSize = 16
	maxNameSize     = 16
	maxPasswordSize = 30
	maxPicSize      = 2 << 20 // 2 MB for profile pic
	maxAboutMeSize  = 120
	maxDateSize     = 15
)

// Signing up a new user.
func SignUpHandler(w http.ResponseWriter, r *http.Request) {
	mr, err := r.MultipartReader()
	if err != nil {
		help.JsonError(w, "Invalid form submission", http.StatusBadRequest, err)
		return
	}

	var (
		email, username, password, firstName, lastName, birthday, aboutMe, accountType string
		profilePic                                                                     []byte
	)

	fields := map[string]struct {
		maxSize  int
		target   *string
		errorMsg string
	}{
		"email":        {maxEmailSize, &email, "Email is too long"},
		"username":     {maxUsernameSize, &username, "Username is too long"},
		"password":     {maxPasswordSize, &password, "Password is too long"},
		"first_name":   {maxNameSize, &firstName, "First name is too long"},
		"last_name":    {maxNameSize, &lastName, "Last name is too long"},
		"birthday":     {maxDateSize, &birthday, "Birthday is invalid"},
		"about_me":     {maxAboutMeSize, &aboutMe, "Your bio is too long"},
		"account_type": {10, &accountType, "Invalid account type"},
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
		// Note: spec is a copy of the struct
		// if u don't use pointer (*spec.target) original email, username, etc stay unchanged → still empty.
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

	// Set default to public
	if accountType != "public" && accountType != "private" {
		accountType = "public"
	}
	uuid := uuid.Must(uuid.NewV4())
	// Build user struct
	user := tp.User{
		ID:          uuid.String(),
		Email:       email,
		Username:    username,
		Password:    password,
		FirstName:   firstName,
		LastName:    lastName,
		Bday:        birthday,
		AboutMe:     aboutMe,
		AccountType: accountType,
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
	profilePicPath := "avatar.webp" // Default profile pic
	if len(profilePic) > 0 {
		if help.IsSVG(profilePic) {
			help.JsonError(w, "svg images aren't supported", http.StatusUnauthorized, nil)
			return
		}
		profilePicPath, err = help.SaveImg(profilePic, "avatars/")
		if err != nil {
			help.JsonError(w, "Failed to save profile image", http.StatusInternalServerError, err)
			return
		}
	}

	// Insert user
	insertUser := `
	INSERT INTO users (id, email, username, password, first_name, last_name, birthday, about_me, profile_pic, account_type)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err = tp.DB.Exec(insertUser, user.ID, user.Email, user.Username, hashedPassword, user.FirstName, user.LastName, user.Bday, user.AboutMe, profilePicPath, user.AccountType)
	if err != nil {
		help.JsonError(w, "unexpected error, try again later", http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("User created successfully"))
}

// Validate signup payload.
func ValidateSignUp(user tp.User) error {
	if user.Email == "" || user.Password == "" || user.FirstName == "" || user.LastName == "" || user.Bday == "" {
		return fmt.Errorf("missing fields")
	}

	// Validate Email
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,20}$`
	if match, _ := regexp.MatchString(emailRegex, user.Email); !match {
		return fmt.Errorf("invalid email format")
	}
	if len(user.Email) > maxEmailSize {
		return fmt.Errorf("email is too long")
	}

	// Validate Username
	if user.Username != "" {
		if len(user.Username) < 3 {
			return fmt.Errorf("username is too short")
		}
		usernameRegex := `^[a-zA-Z0-9_.-]+$`
		if match, _ := regexp.MatchString(usernameRegex, user.Username); !match {
			return fmt.Errorf("username can only contain letters, digits, underscores, dots, and hyphens")
		}

		// Check if username already exists
		exists := false
		err := tp.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)`, user.Username).Scan(&exists)
		if err != nil {
			return fmt.Errorf("unexpected error, try again later")
		}
		if exists {
			return fmt.Errorf("username already exists")
		}
	}

	// Validate bio
	if user.AboutMe != "" && len(user.AboutMe) < 8 {
		return fmt.Errorf("your bio is too short")
	}

	// Validate First Name & Last Name
	nameRegex := `^[a-zA-Z]+$`
	if !regexp.MustCompile(nameRegex).MatchString(user.FirstName) {
		return fmt.Errorf("first name must contain only letters (A-Z, a-z)")
	}
	if len(user.FirstName) < 3 {
		return fmt.Errorf("first name is too short")
	}
	if len(user.LastName) < 3 {
		return fmt.Errorf("last name is too short")
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

	// Check if email already exists
	exists := false
	err := tp.DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)`, user.Email).Scan(&exists)
	if err != nil {
		return fmt.Errorf("unexpected error, try again later")
	}
	if exists {
		return fmt.Errorf("email already exists")
	}

	// Validate birth date
	// Parse the date (backend always get date in YYYY-MM-DD format)
	birthdate, err := time.Parse("2006-01-02", user.Bday)
	if err != nil {
		return fmt.Errorf("invalid date format")
	}

	today := time.Now()
	age := today.Year() - birthdate.Year()
	// Adjust if the birthday hasn't happened yet this year
	if today.Before(birthdate.AddDate(age, 0, 0)) {
		age--
	}
	if age <= 0 {
		return fmt.Errorf("invalid Birthdate")
	}
	// Check min & max age
	if age < 13 {
		return fmt.Errorf("you're too young, go play outside")
	}
	if age > 150 {
		return fmt.Errorf("are you a vampire?")
	}

	return nil
}
