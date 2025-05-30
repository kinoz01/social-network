package helpers

import (
	"bytes"
	"fmt"
	"io"
	"os"

	"github.com/gofrs/uuid"
)

// LimitRead reads the entire stream from `part` and limits the size to maxSize bytes.
// If the data exceeds `maxSize`, it returns an error. Otherwise, it returns the full data.
func LimitRead(part io.Reader, maxSize int) ([]byte, error) {
	var buf bytes.Buffer

	// LimitReader will stop reading after maxSize + 1 bytes.
	limitedReader := io.LimitReader(part, int64(maxSize)+1)

	n, err := io.Copy(&buf, limitedReader)
	if err != nil {
		return nil, fmt.Errorf("failed to read data: %w", err)
	}

	// If we read more than maxSize bytes, the data is too large.
	if n > int64(maxSize) {
		return nil, fmt.Errorf("data exceeds max allowed size")
	}

	// Return the full data (up to maxSize).
	return buf.Bytes(), nil
}

// Check if an image is svg type.
func IsSVG(imageB []byte) bool {
	// Remove unnecessary leading characters
	trimmed := bytes.TrimLeft(imageB, " \t\n\r\xef\xbb\xbf")
	if len(trimmed) < 4 {
		return false // Can't be an SVG
	}
	// Case-insensitive comparison
	lower := bytes.ToLower(trimmed)
	return bytes.HasPrefix(lower, []byte("<?xml")) ||
		bytes.Contains(lower, []byte("<svg"))
}

// Save image and return uuid path to insert in DB.
// Return only Image name
func SaveImg(imageB []byte, genre string) (string, error) {
	imguuid, err := uuid.NewV4()
	if err != nil {
		return "", err
	}
	imgSavingPath := "./storage/" + genre + imguuid.String() + ".jpg"

	err = os.WriteFile(imgSavingPath, imageB, 0o644)
	if err != nil {
		fmt.Printf("Image saved to: \n")
		fmt.Println("Error saving image:", err)
		return "", err
	}

	imgServingPath := imguuid.String() + ".jpg"

	return imgServingPath, nil
}
