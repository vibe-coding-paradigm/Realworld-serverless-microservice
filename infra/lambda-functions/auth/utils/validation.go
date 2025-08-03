package utils

import (
	"regexp"
	"strings"
)

// ValidateEmail validates email format
func ValidateEmail(email string) bool {
	if email == "" {
		return false
	}
	
	// Basic email validation
	emailPattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(emailPattern, email)
	return matched
}

// ValidateUsername validates username format
func ValidateUsername(username string) bool {
	if len(username) < 3 || len(username) > 30 {
		return false
	}
	
	// Allow alphanumeric characters and underscores
	usernamePattern := `^[a-zA-Z0-9_]+$`
	matched, _ := regexp.MatchString(usernamePattern, username)
	return matched
}

// ValidatePassword validates password strength
func ValidatePassword(password string) bool {
	return len(strings.TrimSpace(password)) >= 6
}