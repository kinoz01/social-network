package helpers

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
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

func HandleFileUpload(r *http.Request) (string, error) {
	file, handler, err := r.FormFile("file")
	if err != nil {
		fmt.Println("read file--", err)
		return "", nil
	}
	if handler != nil {
		if err := service_posts.ValidFile(handler); err != nil {
			return "", fmt.Errorf("invalid file: %w", err)
		}
		filePath, err := os.Create("./storage/posts/" + handler.Filename)
		if err != nil {
			return "", fmt.Errorf("failed to ceate a file: %w", err)
		}
		defer filePath.Close()
		_, err = io.Copy(filePath, file)
		if err != nil {
			return "", fmt.Errorf("failed to save file: %w", err)
		}
	}
	return handler.Filename, nil
}
