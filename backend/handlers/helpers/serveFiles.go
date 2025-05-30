package helpers

import (
	"net/http"
	"os"
	"strings"
)

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

	if info.IsDir() || err != nil {
		JsonError(w, http.StatusText(http.StatusForbidden), http.StatusForbidden, nil)
		return
	}

	// Serve the image file
	http.ServeFile(w, r, filePath)
}
