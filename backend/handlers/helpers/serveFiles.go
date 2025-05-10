package helpers

import (
	"bytes"
	"net/http"
	"os"
	"strings"
	"time"
)

// Handle serving static content.
// Api files available at /api/storage/...
func FilesHandler(w http.ResponseWriter, r *http.Request) {
	filePath := "./" + strings.TrimLeft(r.URL.Path, "/api")

	filesBytes, err := os.ReadFile(filePath)
	// Prevent directory traversal attacks, ex: http://127.0.0.1:8080/api/storage/..%2Fdatabase/socNet.db
	if err != nil || strings.Contains(filePath, "..") {
		JsonError(w, http.StatusText(http.StatusForbidden), http.StatusForbidden, err)
		return
	}

	http.ServeContent(w, r, filePath, time.Now(), bytes.NewReader(filesBytes))
}
