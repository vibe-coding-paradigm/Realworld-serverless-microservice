package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
)

// CommentRepository handles comment data operations
type CommentRepository struct {
	db *sql.DB
}

// NewCommentRepository creates a new comment repository
func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

// Create creates a new comment
func (r *CommentRepository) Create(comment *models.Comment, articleSlug, authorID string) error {
	// First, get the article ID from slug
	articleID, err := r.getArticleIDBySlug(articleSlug)
	if err != nil {
		return fmt.Errorf("failed to get article ID: %w", err)
	}

	comment.CreatedAt = time.Now()
	comment.UpdatedAt = time.Now()

	query := `
		INSERT INTO comments (body, author_id, article_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
		RETURNING id
	`

	row := r.db.QueryRow(query, comment.Body, authorID, articleID,
		comment.CreatedAt, comment.UpdatedAt)

	err = row.Scan(&comment.ID)
	if err != nil {
		return fmt.Errorf("failed to create comment: %w", err)
	}

	return nil
}

// GetByArticleSlug retrieves all comments for an article
func (r *CommentRepository) GetByArticleSlug(articleSlug string) ([]models.Comment, error) {
	query := `
		SELECT c.id, c.body, c.created_at, c.updated_at,
		       u.username, u.bio, u.image
		FROM comments c
		JOIN users u ON c.author_id = u.id
		JOIN articles a ON c.article_id = a.id
		WHERE a.slug = ?
		ORDER BY c.created_at ASC
	`

	rows, err := r.db.Query(query, articleSlug)
	if err != nil {
		return nil, fmt.Errorf("failed to query comments: %w", err)
	}
	defer rows.Close()

	// Initialize with empty slice to ensure JSON serializes as [] instead of null
	comments := make([]models.Comment, 0)
	for rows.Next() {
		var comment models.Comment
		var author models.User

		err := rows.Scan(
			&comment.ID,
			&comment.Body,
			&comment.CreatedAt,
			&comment.UpdatedAt,
			&author.Username,
			&author.Bio,
			&author.Image,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}

		// Set author info
		comment.Author = models.Author{
			Username:  author.Username,
			Bio:       author.Bio,
			Image:     author.Image,
			Following: false, // TODO: Implement following logic
		}

		comments = append(comments, comment)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating comments: %w", err)
	}

	return comments, nil
}

// GetByID retrieves a comment by its ID
func (r *CommentRepository) GetByID(commentID string) (*models.Comment, error) {
	query := `
		SELECT c.id, c.body, c.created_at, c.updated_at,
		       u.username, u.bio, u.image
		FROM comments c
		JOIN users u ON c.author_id = u.id
		WHERE c.id = ?
	`

	var comment models.Comment
	var author models.User
	row := r.db.QueryRow(query, commentID)

	err := row.Scan(
		&comment.ID,
		&comment.Body,
		&comment.CreatedAt,
		&comment.UpdatedAt,
		&author.Username,
		&author.Bio,
		&author.Image,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("comment not found")
		}
		return nil, fmt.Errorf("failed to get comment by ID: %w", err)
	}

	// Set author info
	comment.Author = models.Author{
		Username:  author.Username,
		Bio:       author.Bio,
		Image:     author.Image,
		Following: false, // TODO: Implement following logic
	}

	return &comment, nil
}

// Delete deletes a comment by ID
func (r *CommentRepository) Delete(commentID string) error {
	query := `DELETE FROM comments WHERE id = ?`

	result, err := r.db.Exec(query, commentID)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("comment not found")
	}

	return nil
}

// IsAuthor checks if a user is the author of a comment
func (r *CommentRepository) IsAuthor(commentID, userID string) (bool, error) {
	query := `SELECT COUNT(*) FROM comments WHERE id = ? AND author_id = ?`

	var count int
	err := r.db.QueryRow(query, commentID, userID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check comment authorship: %w", err)
	}

	return count > 0, nil
}

// Helper methods

// getArticleIDBySlug gets an article ID by its slug
func (r *CommentRepository) getArticleIDBySlug(slug string) (string, error) {
	var articleID string
	query := `SELECT id FROM articles WHERE slug = ?`

	err := r.db.QueryRow(query, slug).Scan(&articleID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("article not found")
		}
		return "", fmt.Errorf("failed to get article ID: %w", err)
	}

	return articleID, nil
}
