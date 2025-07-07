package models

import (
	"time"
)

// Article represents a blog article
type Article struct {
	ID             string    `json:"id"`
	Slug           string    `json:"slug"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Body           string    `json:"body"`
	TagList        []string  `json:"tagList"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	Favorited      bool      `json:"favorited"`
	FavoritesCount int       `json:"favoritesCount"`
	Author         Author    `json:"author"`
}

// Author represents article author information
type Author struct {
	Username  string `json:"username"`
	Bio       string `json:"bio"`
	Image     string `json:"image"`
	Following bool   `json:"following"`
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

// ToResponse converts Article to the response format with author info
func (a *Article) ToResponse(author *User) ArticleResponse {
	return ArticleResponse{
		Article: Article{
			ID:             a.ID,
			Slug:           a.Slug,
			Title:          a.Title,
			Description:    a.Description,
			Body:           a.Body,
			TagList:        a.TagList,
			CreatedAt:      a.CreatedAt,
			UpdatedAt:      a.UpdatedAt,
			Favorited:      a.Favorited,
			FavoritesCount: a.FavoritesCount,
			Author: Author{
				Username:  author.Username,
				Bio:       author.Bio,
				Image:     author.Image,
				Following: false, // TODO: Implement following logic
			},
		},
	}
}
