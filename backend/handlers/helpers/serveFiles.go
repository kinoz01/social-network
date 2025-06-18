package helpers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const fileLimit = 4 << 20 // 4MB

// Handle serving static content.
// Api files available at /api/storage/...
func FilesHandler(w http.ResponseWriter, r *http.Request) {
	// Prevent directory traversal attacks, ex: http://127.0.0.1:8080/api/storage/..%2Fdatabase/socNet.db
	if strings.Contains(r.URL.Path, "..") {
		JsonError(w, http.StatusText(http.StatusForbidden), http.StatusForbidden, nil)
		return
	}

	filePath := "./" + strings.TrimLeft(r.URL.Path, "/api")

	info, err := os.Stat(filePath)
	if err != nil || (info != nil && info.IsDir()) {
		JsonError(w, http.StatusText(http.StatusForbidden), http.StatusForbidden, nil)
		return
	}

	// Serve the image file
	http.ServeFile(w, r, filePath)
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
		if p, err := SaveImg(buff, genre); err == nil {
			return p, nil
		}
	}
	return "", fmt.Errorf("no file handler present")
}
