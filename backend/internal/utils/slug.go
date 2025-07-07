package utils

import (
	"fmt"
	"regexp"
	"strings"
)

// GenerateSlug creates a URL-friendly slug from a title
func GenerateSlug(title string) string {
	if title == "" {
		return "untitled"
	}

	// Convert to lowercase
	slug := strings.ToLower(title)

	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")

	// Remove special characters, keep only alphanumeric and hyphens
	reg := regexp.MustCompile(`[^a-z0-9\-]`)
	slug = reg.ReplaceAllString(slug, "")

	// Remove multiple consecutive hyphens
	reg = regexp.MustCompile(`-+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Remove leading and trailing hyphens
	slug = strings.Trim(slug, "-")

	// Ensure slug is not empty
	if slug == "" {
		slug = "untitled"
	}

	return slug
}

// GenerateUniqueSlug creates a unique slug by appending a number suffix if needed
func GenerateUniqueSlug(title string, existingSlugs []string) string {
	baseSlug := GenerateSlug(title)

	// Check if base slug is unique
	if !contains(existingSlugs, baseSlug) {
		return baseSlug
	}

	// Append number suffix until unique
	for i := 1; i <= 1000; i++ { // Reasonable limit to prevent infinite loop
		candidateSlug := fmt.Sprintf("%s-%d", baseSlug, i)
		if !contains(existingSlugs, candidateSlug) {
			return candidateSlug
		}
	}

	// Fallback with timestamp if all numbers are taken
	return fmt.Sprintf("%s-%d", baseSlug, 999999)
}

// contains checks if a slice contains a specific string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
