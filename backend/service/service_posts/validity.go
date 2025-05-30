package service_posts

import (
	"fmt"
	"mime/multipart"
	"strings"
)

func ValidVisibility(visibility string) string {
	visibility = strings.ToLower(strings.TrimSpace(visibility))
	validChoice := map[string]bool{
		"public":         true,
		"private":        true,
		"almost-private": true,
	}
	if !validChoice[visibility] {
		return "public"
	}
	return visibility
}

func ValidInput(inputs string) error {
	trimSpace := strings.TrimSpace(inputs)
	if len(trimSpace) > 5000 {
		return fmt.Errorf("post content exceeds 5000 characters limit")
	}
	return nil
}

func ValidFile(handler *multipart.FileHeader) error {
	// fmt.Printf("here fileeeee------------->%v \n and handler %v\n", handler.Size, handler.Header.Get("Content-Type"))
	contentType := handler.Header.Get("Content-Type")
	allowedType := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}
	if !allowedType[contentType] {
		return fmt.Errorf("invalid file type: %s. Only images (JPEG, PNG, WEBP) are allowed", contentType)
	}
	return nil
}
