package helpers

import (
	"fmt"
	"io"
	"net/http"
	"os"
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

// Reads the uploaded file with a size limit, checks img ext validity and return uuid to be insterted in db.
func HandleFileUpload(r *http.Request, genre string, formFile string) (string, error) {
	file, handler, err := r.FormFile(formFile) //- file: uploaded content to read from | handler: file data
	if err != nil {
		return "", nil
	}
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return "", fmt.Errorf("could not read file for validation")
	}
	contentType := http.DetectContentType(buffer)
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
		"image/jpg":  true,
		"image/gif":  true,
	}

	if !allowedTypes[contentType] {
		return "", fmt.Errorf("invalid image format. Allowed: jpeg, png, webp, jpg and gif")
	}
	file.Seek(0, io.SeekStart)

	buff, err := LimitRead(file, fileLimit)
	if err != nil {
		return "", fmt.Errorf("file size exceeds %d limit: %w", fileLimit, err)
	}
	if handler != nil {
		if p, err := SaveImg(buff, genre); err == nil {
			return p, nil
		}
	}
	return "", fmt.Errorf("no file handler present")
}
