package utils

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// GenerateSlug creates a URL-friendly slug from a title
func GenerateSlug(title string) string {
	// Convert to lowercase
	slug := strings.ToLower(title)
	
	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	
	// Remove non-alphanumeric characters except hyphens
	reg := regexp.MustCompile(`[^a-z0-9\-]`)
	slug = reg.ReplaceAllString(slug, "")
	
	// Remove multiple consecutive hyphens
	reg = regexp.MustCompile(`-+`)
	slug = reg.ReplaceAllString(slug, "-")
	
	// Remove leading and trailing hyphens
	slug = strings.Trim(slug, "-")
	
	return slug
}

// GenerateUniqueSlug generates a unique slug by appending a number if necessary
func GenerateUniqueSlug(title string, existingSlugs []string) string {
	baseSlug := GenerateSlug(title)
	
	// Check if base slug is available
	if !containsSlug(existingSlugs, baseSlug) {
		return baseSlug
	}
	
	// Find the highest number suffix
	maxNum := 0
	basePattern := baseSlug + "-"
	
	for _, slug := range existingSlugs {
		if strings.HasPrefix(slug, basePattern) {
			suffix := strings.TrimPrefix(slug, basePattern)
			if num, err := strconv.Atoi(suffix); err == nil && num > maxNum {
				maxNum = num
			}
		}
	}
	
	// Return slug with next available number
	return fmt.Sprintf("%s-%d", baseSlug, maxNum+1)
}

// containsSlug checks if a slice contains a specific slug
func containsSlug(slugs []string, target string) bool {
	for _, slug := range slugs {
		if slug == target {
			return true
		}
	}
	return false
}