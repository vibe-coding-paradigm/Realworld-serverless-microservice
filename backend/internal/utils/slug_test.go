package utils

import (
	"testing"
)

func TestGenerateSlug(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Hello World", "hello-world"},
		{"This is a Test Article!", "this-is-a-test-article"},
		{"Multiple   Spaces", "multiple-spaces"},
		{"Special@#$%Characters", "specialcharacters"},
		{"", "untitled"},
		{"---", "untitled"},
		{"Already-lowercase-with-hyphens", "already-lowercase-with-hyphens"},
		{"123 Numbers 456", "123-numbers-456"},
	}

	for _, test := range tests {
		result := GenerateSlug(test.input)
		if result != test.expected {
			t.Errorf("GenerateSlug(%q) = %q, expected %q", test.input, result, test.expected)
		}
	}
}

func TestGenerateUniqueSlug(t *testing.T) {
	existing := []string{"hello-world", "hello-world-1", "hello-world-2"}

	// Test unique slug
	result := GenerateUniqueSlug("Unique Title", existing)
	expected := "unique-title"
	if result != expected {
		t.Errorf("GenerateUniqueSlug('Unique Title', existing) = %q, expected %q", result, expected)
	}

	// Test duplicate slug
	result = GenerateUniqueSlug("Hello World", existing)
	expected = "hello-world-3"
	if result != expected {
		t.Errorf("GenerateUniqueSlug('Hello World', existing) = %q, expected %q", result, expected)
	}
}
