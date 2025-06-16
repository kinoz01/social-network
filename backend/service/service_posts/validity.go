package service_posts

import (
	"fmt"
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
	if len(trimSpace) == 0 {
		return fmt.Errorf("post content cannot be empty")
	}

	if len(trimSpace) > 3000 {
		return fmt.Errorf("post content exceeds 3000 characters limit")
	}
	return nil
}
