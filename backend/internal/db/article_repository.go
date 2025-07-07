package db

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/models"
	"github.com/vibe-coding-paradigm/realworld-build-from-prd/internal/utils"
)

// ArticleRepository handles article data operations
type ArticleRepository struct {
	db *sql.DB
}

// NewArticleRepository creates a new article repository
func NewArticleRepository(db *sql.DB) *ArticleRepository {
	return &ArticleRepository{db: db}
}

// Create creates a new article
func (r *ArticleRepository) Create(article *models.Article) error {
	// Generate unique slug
	slug := utils.GenerateSlug(article.Title)
	existingSlugs, err := r.getSimilarSlugs(slug)
	if err != nil {
		return fmt.Errorf("failed to check existing slugs: %w", err)
	}

	article.Slug = utils.GenerateUniqueSlug(article.Title, existingSlugs)
	article.CreatedAt = time.Now()
	article.UpdatedAt = time.Now()

	// Get author ID from username (assuming this is passed correctly)
	var authorID string
	err = r.db.QueryRow("SELECT id FROM users WHERE username = ?", article.Author.Username).Scan(&authorID)
	if err != nil {
		return fmt.Errorf("failed to get author ID: %w", err)
	}

	query := `
		INSERT INTO articles (slug, title, description, body, author_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		RETURNING id
	`

	row := r.db.QueryRow(query, article.Slug, article.Title, article.Description,
		article.Body, authorID, article.CreatedAt, article.UpdatedAt)

	err = row.Scan(&article.ID)
	if err != nil {
		return fmt.Errorf("failed to create article: %w", err)
	}

	// Handle tags
	if len(article.TagList) > 0 {
		if err := r.saveTags(article.ID, article.TagList); err != nil {
			return fmt.Errorf("failed to save tags: %w", err)
		}
	}

	return nil
}

// GetBySlug retrieves an article by its slug
func (r *ArticleRepository) GetBySlug(slug string) (*models.Article, error) {
	query := `
		SELECT a.id, a.slug, a.title, a.description, a.body, a.created_at, a.updated_at,
		       u.username, u.bio, u.image,
		       COUNT(f.user_id) as favorites_count
		FROM articles a
		JOIN users u ON a.author_id = u.id
		LEFT JOIN favorites f ON a.id = f.article_id
		WHERE a.slug = ?
		GROUP BY a.id, u.id
	`

	var article models.Article
	var author models.User
	row := r.db.QueryRow(query, slug)

	err := row.Scan(
		&article.ID,
		&article.Slug,
		&article.Title,
		&article.Description,
		&article.Body,
		&article.CreatedAt,
		&article.UpdatedAt,
		&author.Username,
		&author.Bio,
		&author.Image,
		&article.FavoritesCount,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("article not found")
		}
		return nil, fmt.Errorf("failed to get article by slug: %w", err)
	}

	// Load tags
	tags, err := r.getArticleTags(article.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to load tags: %w", err)
	}
	article.TagList = tags

	// Set author info
	article.Author = models.Author{
		Username:  author.Username,
		Bio:       author.Bio,
		Image:     author.Image,
		Following: false, // TODO: Implement following logic
	}

	return &article, nil
}

// GetAll retrieves articles with filtering and pagination
func (r *ArticleRepository) GetAll(filter models.ArticleFilter) ([]models.Article, int, error) {
	whereClause := ""
	args := []interface{}{}

	// Build WHERE clause
	conditions := []string{}

	if filter.Tag != "" {
		conditions = append(conditions, "t.name = ?")
		args = append(args, filter.Tag)
	}

	if filter.Author != "" {
		conditions = append(conditions, "u.username = ?")
		args = append(args, filter.Author)
	}

	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Count query
	countQuery := fmt.Sprintf(`
		SELECT COUNT(DISTINCT a.id)
		FROM articles a
		JOIN users u ON a.author_id = u.id
		LEFT JOIN article_tags at ON a.id = at.article_id
		LEFT JOIN tags t ON at.tag_id = t.id
		%s
	`, whereClause)

	var totalCount int
	err := r.db.QueryRow(countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count articles: %w", err)
	}

	// Main query
	query := fmt.Sprintf(`
		SELECT DISTINCT a.id, a.slug, a.title, a.description, a.body, a.created_at, a.updated_at,
		       u.username, u.bio, u.image,
		       COUNT(f.user_id) as favorites_count
		FROM articles a
		JOIN users u ON a.author_id = u.id
		LEFT JOIN article_tags at ON a.id = at.article_id
		LEFT JOIN tags t ON at.tag_id = t.id
		LEFT JOIN favorites f ON a.id = f.article_id
		%s
		GROUP BY a.id, u.id
		ORDER BY a.created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	// Add pagination parameters
	args = append(args, filter.Limit, filter.Offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query articles: %w", err)
	}
	defer rows.Close()

	var articles []models.Article
	for rows.Next() {
		var article models.Article
		var author models.User

		err := rows.Scan(
			&article.ID,
			&article.Slug,
			&article.Title,
			&article.Description,
			&article.Body,
			&article.CreatedAt,
			&article.UpdatedAt,
			&author.Username,
			&author.Bio,
			&author.Image,
			&article.FavoritesCount,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan article: %w", err)
		}

		// Load tags for each article
		tags, err := r.getArticleTags(article.ID)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to load tags for article %s: %w", article.ID, err)
		}
		article.TagList = tags

		// Set author info
		article.Author = models.Author{
			Username:  author.Username,
			Bio:       author.Bio,
			Image:     author.Image,
			Following: false, // TODO: Implement following logic
		}

		articles = append(articles, article)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterating articles: %w", err)
	}

	return articles, totalCount, nil
}

// Update updates an existing article
func (r *ArticleRepository) Update(slug string, article *models.Article) error {
	article.UpdatedAt = time.Now()

	// If title changed, regenerate slug
	if article.Title != "" {
		newSlug := utils.GenerateSlug(article.Title)
		if newSlug != slug {
			existingSlugs, err := r.getSimilarSlugs(newSlug)
			if err != nil {
				return fmt.Errorf("failed to check existing slugs: %w", err)
			}
			article.Slug = utils.GenerateUniqueSlug(article.Title, existingSlugs)
		}
	}

	query := `
		UPDATE articles 
		SET title = COALESCE(?, title),
		    description = COALESCE(?, description),
		    body = COALESCE(?, body),
		    slug = COALESCE(?, slug),
		    updated_at = ?
		WHERE slug = ?
	`

	result, err := r.db.Exec(query,
		article.Title,
		article.Description,
		article.Body,
		article.Slug,
		article.UpdatedAt,
		slug,
	)

	if err != nil {
		return fmt.Errorf("failed to update article: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("article not found")
	}

	return nil
}

// Delete deletes an article by slug
func (r *ArticleRepository) Delete(slug string) error {
	query := `DELETE FROM articles WHERE slug = ?`

	result, err := r.db.Exec(query, slug)
	if err != nil {
		return fmt.Errorf("failed to delete article: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("article not found")
	}

	return nil
}

// Helper methods

// getSimilarSlugs gets all slugs that start with the given base slug
func (r *ArticleRepository) getSimilarSlugs(baseSlug string) ([]string, error) {
	query := `SELECT slug FROM articles WHERE slug LIKE ?`

	rows, err := r.db.Query(query, baseSlug+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slugs []string
	for rows.Next() {
		var slug string
		if err := rows.Scan(&slug); err != nil {
			return nil, err
		}
		slugs = append(slugs, slug)
	}

	return slugs, rows.Err()
}

// saveTags saves tags for an article
func (r *ArticleRepository) saveTags(articleID string, tagNames []string) error {
	// First, delete existing tags for this article
	_, err := r.db.Exec(`DELETE FROM article_tags WHERE article_id = ?`, articleID)
	if err != nil {
		return err
	}

	for _, tagName := range tagNames {
		// Get or create tag
		tagID, err := r.getOrCreateTag(tagName)
		if err != nil {
			return err
		}

		// Associate tag with article
		_, err = r.db.Exec(`
			INSERT INTO article_tags (article_id, tag_id) 
			VALUES (?, ?)
		`, articleID, tagID)
		if err != nil {
			return err
		}
	}

	return nil
}

// getOrCreateTag gets existing tag or creates a new one
func (r *ArticleRepository) getOrCreateTag(name string) (string, error) {
	// Try to get existing tag
	var tagID string
	err := r.db.QueryRow(`SELECT id FROM tags WHERE name = ?`, name).Scan(&tagID)
	if err == nil {
		return tagID, nil
	}

	if err != sql.ErrNoRows {
		return "", err
	}

	// Create new tag
	err = r.db.QueryRow(`
		INSERT INTO tags (name, created_at) 
		VALUES (?, ?) 
		RETURNING id
	`, name, time.Now()).Scan(&tagID)

	return tagID, err
}

// getArticleTags gets all tags for an article
func (r *ArticleRepository) getArticleTags(articleID string) ([]string, error) {
	query := `
		SELECT t.name 
		FROM tags t
		JOIN article_tags at ON t.id = at.tag_id
		WHERE at.article_id = ?
		ORDER BY t.name
	`

	rows, err := r.db.Query(query, articleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []string
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}

	return tags, rows.Err()
}
