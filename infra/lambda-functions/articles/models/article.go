package models

import (
	"time"
)

// Article represents a blog article in DynamoDB
type Article struct {
	// DynamoDB Keys
	PK string `json:"-" dynamodbav:"PK"` // ARTICLE#<article_id>
	SK string `json:"-" dynamodbav:"SK"` // METADATA

	// Article fields
	ArticleID      string    `json:"id" dynamodbav:"article_id"`
	Slug           string    `json:"slug" dynamodbav:"slug"`
	Title          string    `json:"title" dynamodbav:"title"`
	Description    string    `json:"description" dynamodbav:"description"`
	Body           string    `json:"body" dynamodbav:"body"`
	TagList        []string  `json:"tagList" dynamodbav:"tag_list"`
	CreatedAt      time.Time `json:"createdAt" dynamodbav:"created_at"`
	UpdatedAt      time.Time `json:"updatedAt" dynamodbav:"updated_at"`
	Favorited      bool      `json:"favorited" dynamodbav:"-"` // Calculated field
	FavoritesCount int       `json:"favoritesCount" dynamodbav:"favorites_count"`

	// Author information (denormalized for performance)
	AuthorID       string `json:"-" dynamodbav:"author_id"`
	AuthorUsername string `json:"-" dynamodbav:"author_username"`
	AuthorBio      string `json:"-" dynamodbav:"author_bio"`
	AuthorImage    string `json:"-" dynamodbav:"author_image"`

	// Response-only nested author
	Author Author `json:"author" dynamodbav:"-"`
}

// Author represents article author information
type Author struct {
	Username  string `json:"username"`
	Bio       string `json:"bio"`
	Image     string `json:"image"`
	Following bool   `json:"following"` // Calculated field
}

// Favorite represents a favorite relationship in DynamoDB
type Favorite struct {
	PK        string    `json:"-" dynamodbav:"PK"`        // USER#<user_id>
	SK        string    `json:"-" dynamodbav:"SK"`        // FAVORITE#<article_id>
	UserID    string    `json:"user_id" dynamodbav:"user_id"`
	ArticleID string    `json:"article_id" dynamodbav:"article_id"`
	CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"`
}

// ArticleResponse represents the API response format for articles
type ArticleResponse struct {
	Article Article `json:"article"`
}

// ArticlesResponse represents the API response format for multiple articles
type ArticlesResponse struct {
	Articles      []Article `json:"articles"`
	ArticlesCount int       `json:"articlesCount"`
}

// CreateArticleRequest represents the request format for creating articles
type CreateArticleRequest struct {
	Article struct {
		Title       string   `json:"title"`
		Description string   `json:"description"`
		Body        string   `json:"body"`
		TagList     []string `json:"tagList,omitempty"`
	} `json:"article"`
}

// UpdateArticleRequest represents the request format for updating articles
type UpdateArticleRequest struct {
	Article struct {
		Title       *string  `json:"title,omitempty"`
		Description *string  `json:"description,omitempty"`
		Body        *string  `json:"body,omitempty"`
		TagList     []string `json:"tagList,omitempty"`
	} `json:"article"`
}

// ArticleFilter represents filtering options for articles
type ArticleFilter struct {
	Tag       string
	Author    string
	Favorited string
	Limit     int
	Offset    int
}

// SetPrimaryKey sets the DynamoDB primary key for an article
func (a *Article) SetPrimaryKey() {
	a.PK = "ARTICLE#" + a.ArticleID
	a.SK = "METADATA"
}

// SetAuthorInfo sets the author information in the response format
func (a *Article) SetAuthorInfo() {
	a.Author = Author{
		Username:  a.AuthorUsername,
		Bio:       a.AuthorBio,
		Image:     a.AuthorImage,
		Following: false, // TODO: Implement following logic
	}
}

// SetFavoriteKeys sets the DynamoDB keys for a favorite relationship
func (f *Favorite) SetFavoriteKeys() {
	f.PK = "USER#" + f.UserID
	f.SK = "FAVORITE#" + f.ArticleID
}

// ToResponse converts Article to the response format
func (a *Article) ToResponse() ArticleResponse {
	a.SetAuthorInfo()
	return ArticleResponse{
		Article: *a,
	}
}