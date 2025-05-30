package helpers

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"social-network/service/service_posts"
)

const fileLimit = 4 << 20 // 4MB

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

func HandleFileUpload(r *http.Request, genre string, formFile string) (string, error) {
	file, handler, err := r.FormFile(formFile)
	if err != nil {
		return "", nil
	}
	buff, err := LimitRead(file, fileLimit)
	if err != nil {
		return "", fmt.Errorf("file size exceeds %d limit: %w", fileLimit, err)
	}
	ext := strings.ToLower(filepath.Ext(handler.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
	default:
		return "", fmt.Errorf("unsupported image format")
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
