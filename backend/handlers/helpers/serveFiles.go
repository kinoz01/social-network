package helpers

import (
	"bytes"
	"fmt"
	"net/http"
	"os"

	// hlp "social-network/handlers/helpers"
	// help "social-network/handlers/helpers"
	// "social-network/handlers/helpers"
	"social-network/service/service_posts"
	"strings"
	"time"
)

// Handle serving static content.
// Api files available at /api/storage/...
func FilesHandler(w http.ResponseWriter, r *http.Request) {
	filePath := "./" + strings.TrimLeft(r.URL.Path, "/api")

	filesBytes, err := os.ReadFile(filePath)
	// Prevent directory traversal attacks, ex: http://127.0.0.1:8080/..%2F..%2Fmain.go
	if err != nil || strings.Contains(filePath, "..") {
		JsonError(w, http.StatusText(http.StatusForbidden), http.StatusForbidden, err)
		return
	}

	http.ServeContent(w, r, filePath, time.Now(), bytes.NewReader(filesBytes))
}

func HamdleFIleUpload(r *http.Request, genre string) (string, error) {
	file, handler, err := r.FormFile("file")
	if err != nil {
		fmt.Println("read file--", err)
		return "", nil
	}
	buff, err := LimitRead(file, 4<<20)
	if err != nil {
		return "", fmt.Errorf("file size exceeds %s limit: %w", "4MB", err)
	}
	if handler != nil {
		if err := service_posts.ValidFile(handler); err != nil {
			return "", fmt.Errorf("invalid file: %w", err)
		}
		if p, err := SaveImg(buff, genre); err == nil {
			fmt.Printf("Image saved to: %s\n", p)
			return p, nil
		}
	}
	return "", fmt.Errorf("no file handler present")
}
