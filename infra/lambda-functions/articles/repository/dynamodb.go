package repository

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
	"github.com/vibe-coding-paradigm/realworld-serverless-articles/models"
	"github.com/vibe-coding-paradigm/realworld-serverless-articles/utils"
)

// DynamoDBRepository implements article repository using DynamoDB
type DynamoDBRepository struct {
	dynamoClient *dynamodb.DynamoDB
	tableName    string
}

// NewDynamoDBRepository creates a new DynamoDB repository
func NewDynamoDBRepository(dynamoClient *dynamodb.DynamoDB, tableName string) *DynamoDBRepository {
	return &DynamoDBRepository{
		dynamoClient: dynamoClient,
		tableName:    tableName,
	}
}

// Create creates a new article
func (r *DynamoDBRepository) Create(article *models.Article, authorID string, authorUsername string, authorBio string, authorImage string) error {
	// Generate unique article ID and slug
	article.ArticleID = uuid.New().String()
	slug := utils.GenerateSlug(article.Title)
	
	// Check for existing slugs and generate unique one
	existingSlugs, err := r.getSimilarSlugs(slug)
	if err != nil {
		return fmt.Errorf("failed to check existing slugs: %w", err)
	}
	
	article.Slug = utils.GenerateUniqueSlug(article.Title, existingSlugs)
	article.CreatedAt = time.Now()
	article.UpdatedAt = time.Now()
	article.FavoritesCount = 0
	
	// Set author information (denormalized)
	article.AuthorID = authorID
	article.AuthorUsername = authorUsername
	article.AuthorBio = authorBio
	article.AuthorImage = authorImage
	
	// Set DynamoDB keys
	article.SetPrimaryKey()
	
	// Marshall the article
	item, err := dynamodbattribute.MarshalMap(article)
	if err != nil {
		return fmt.Errorf("failed to marshal article: %w", err)
	}
	
	// Create the article
	_, err = r.dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      item,
		ConditionExpression: aws.String("attribute_not_exists(PK)"), // Ensure no duplicate
	})
	
	if err != nil {
		return fmt.Errorf("failed to create article: %w", err)
	}
	
	return nil
}

// GetBySlug retrieves an article by its slug
func (r *DynamoDBRepository) GetBySlug(slug string, userID string) (*models.Article, error) {
	// Use GSI to find article by slug
	result, err := r.dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		IndexName:              aws.String("SlugIndex"),
		KeyConditionExpression: aws.String("slug = :slug"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":slug": {S: aws.String(slug)},
		},
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to query article by slug: %w", err)
	}
	
	if len(result.Items) == 0 {
		return nil, fmt.Errorf("article not found")
	}
	
	var article models.Article
	err = dynamodbattribute.UnmarshalMap(result.Items[0], &article)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal article: %w", err)
	}
	
	// Check if user has favorited this article
	if userID != "" {
		favorited, err := r.isArticleFavorited(userID, article.ArticleID)
		if err != nil {
			return nil, fmt.Errorf("failed to check favorite status: %w", err)
		}
		article.Favorited = favorited
	}
	
	article.SetAuthorInfo()
	return &article, nil
}

// GetAll retrieves articles with filtering and pagination
func (r *DynamoDBRepository) GetAll(filter models.ArticleFilter, userID string) ([]models.Article, int, error) {
	var queryInput *dynamodb.QueryInput
	var scanInput *dynamodb.ScanInput
	
	// Build query/scan based on filters
	if filter.Author != "" {
		// Use AuthorIndex GSI for author-based queries
		queryInput = &dynamodb.QueryInput{
			TableName:              aws.String(r.tableName),
			IndexName:              aws.String("AuthorIndex"),
			KeyConditionExpression: aws.String("author_username = :author"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":author": {S: aws.String(filter.Author)},
			},
			ScanIndexForward: aws.Bool(false), // Latest first
		}
	} else {
		// Use scan for general queries
		scanInput = &dynamodb.ScanInput{
			TableName: aws.String(r.tableName),
			FilterExpression: aws.String("SK = :sk"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":sk": {S: aws.String("METADATA")},
			},
		}
		
		// Add tag filter if specified
		if filter.Tag != "" {
			scanInput.FilterExpression = aws.String("SK = :sk AND contains(tag_list, :tag)")
			scanInput.ExpressionAttributeValues[":tag"] = &dynamodb.AttributeValue{S: aws.String(filter.Tag)}
		}
	}
	
	var items []map[string]*dynamodb.AttributeValue
	var err error
	
	if queryInput != nil {
		result, err := r.dynamoClient.Query(queryInput)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to query articles: %w", err)
		}
		items = result.Items
	} else {
		result, err := r.dynamoClient.Scan(scanInput)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan articles: %w", err)
		}
		items = result.Items
	}
	
	// Convert to articles
	var allArticles []models.Article
	for _, item := range items {
		var article models.Article
		err = dynamodbattribute.UnmarshalMap(item, &article)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal article: %w", err)
		}
		
		// Check if user has favorited this article
		if userID != "" {
			favorited, err := r.isArticleFavorited(userID, article.ArticleID)
			if err != nil {
				return nil, 0, fmt.Errorf("failed to check favorite status: %w", err)
			}
			article.Favorited = favorited
		}
		
		article.SetAuthorInfo()
		allArticles = append(allArticles, article)
	}
	
	// Apply pagination
	totalCount := len(allArticles)
	start := filter.Offset
	end := start + filter.Limit
	
	if start > totalCount {
		return []models.Article{}, totalCount, nil
	}
	
	if end > totalCount {
		end = totalCount
	}
	
	paginatedArticles := allArticles[start:end]
	return paginatedArticles, totalCount, nil
}

// Update updates an existing article
func (r *DynamoDBRepository) Update(slug string, updateReq *models.UpdateArticleRequest, userID string) (*models.Article, error) {
	// First, get the article to ensure it exists and user owns it
	article, err := r.GetBySlug(slug, userID)
	if err != nil {
		return nil, err
	}
	
	// Check ownership
	if article.AuthorID != userID {
		return nil, fmt.Errorf("unauthorized: user does not own this article")
	}
	
	// Prepare update expression
	updateExpression := "SET updated_at = :updated_at"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":updated_at": {S: aws.String(time.Now().Format(time.RFC3339))},
	}
	
	// Update title if provided
	if updateReq.Article.Title != nil {
		updateExpression += ", title = :title"
		expressionAttributeValues[":title"] = &dynamodb.AttributeValue{S: aws.String(*updateReq.Article.Title)}
		
		// Update slug if title changed
		newSlug := utils.GenerateSlug(*updateReq.Article.Title)
		if newSlug != slug {
			existingSlugs, err := r.getSimilarSlugs(newSlug)
			if err != nil {
				return nil, fmt.Errorf("failed to check existing slugs: %w", err)
			}
			uniqueSlug := utils.GenerateUniqueSlug(*updateReq.Article.Title, existingSlugs)
			updateExpression += ", slug = :slug"
			expressionAttributeValues[":slug"] = &dynamodb.AttributeValue{S: aws.String(uniqueSlug)}
		}
	}
	
	// Update description if provided
	if updateReq.Article.Description != nil {
		updateExpression += ", description = :description"
		expressionAttributeValues[":description"] = &dynamodb.AttributeValue{S: aws.String(*updateReq.Article.Description)}
	}
	
	// Update body if provided
	if updateReq.Article.Body != nil {
		updateExpression += ", body = :body"
		expressionAttributeValues[":body"] = &dynamodb.AttributeValue{S: aws.String(*updateReq.Article.Body)}
	}
	
	// Update tags if provided
	if len(updateReq.Article.TagList) > 0 {
		tagListAttr, err := dynamodbattribute.Marshal(updateReq.Article.TagList)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal tag list: %w", err)
		}
		updateExpression += ", tag_list = :tag_list"
		expressionAttributeValues[":tag_list"] = tagListAttr
	}
	
	// Perform the update
	_, err = r.dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {S: aws.String(article.PK)},
			"SK": {S: aws.String(article.SK)},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionAttributeValues,
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to update article: %w", err)
	}
	
	// Return the updated article
	updatedSlug := slug
	if updateReq.Article.Title != nil {
		newSlug := utils.GenerateSlug(*updateReq.Article.Title)
		if newSlug != slug {
			existingSlugs, err := r.getSimilarSlugs(newSlug)
			if err == nil {
				updatedSlug = utils.GenerateUniqueSlug(*updateReq.Article.Title, existingSlugs)
			}
		}
	}
	
	return r.GetBySlug(updatedSlug, userID)
}

// Delete deletes an article by slug
func (r *DynamoDBRepository) Delete(slug string, userID string) error {
	// First, get the article to ensure it exists and user owns it
	article, err := r.GetBySlug(slug, userID)
	if err != nil {
		return err
	}
	
	// Check ownership
	if article.AuthorID != userID {
		return fmt.Errorf("unauthorized: user does not own this article")
	}
	
	// Delete the article
	_, err = r.dynamoClient.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {S: aws.String(article.PK)},
			"SK": {S: aws.String(article.SK)},
		},
	})
	
	if err != nil {
		return fmt.Errorf("failed to delete article: %w", err)
	}
	
	return nil
}

// FavoriteArticle adds an article to user's favorites
func (r *DynamoDBRepository) FavoriteArticle(slug string, userID string) (*models.Article, error) {
	// Get the article
	article, err := r.GetBySlug(slug, userID)
	if err != nil {
		return nil, err
	}
	
	// Create favorite relationship
	favorite := &models.Favorite{
		UserID:    userID,
		ArticleID: article.ArticleID,
		CreatedAt: time.Now(),
	}
	favorite.SetFavoriteKeys()
	
	// Marshall the favorite
	favoriteItem, err := dynamodbattribute.MarshalMap(favorite)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal favorite: %w", err)
	}
	
	// Add favorite (use condition to prevent duplicates)
	_, err = r.dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String(r.tableName),
		Item:                favoriteItem,
		ConditionExpression: aws.String("attribute_not_exists(PK)"),
	})
	
	if err != nil {
		// If it's a conditional check failed, it means already favorited
		if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
			return article, nil // Already favorited, return current state
		}
		return nil, fmt.Errorf("failed to favorite article: %w", err)
	}
	
	// Increment favorites count
	err = r.incrementFavoritesCount(article.ArticleID, 1)
	if err != nil {
		return nil, fmt.Errorf("failed to increment favorites count: %w", err)
	}
	
	// Return updated article
	return r.GetBySlug(slug, userID)
}

// UnfavoriteArticle removes an article from user's favorites
func (r *DynamoDBRepository) UnfavoriteArticle(slug string, userID string) (*models.Article, error) {
	// Get the article
	article, err := r.GetBySlug(slug, userID)
	if err != nil {
		return nil, err
	}
	
	// Delete favorite relationship
	favorite := &models.Favorite{
		UserID:    userID,
		ArticleID: article.ArticleID,
	}
	favorite.SetFavoriteKeys()
	
	_, err = r.dynamoClient.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {S: aws.String(favorite.PK)},
			"SK": {S: aws.String(favorite.SK)},
		},
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to unfavorite article: %w", err)
	}
	
	// Decrement favorites count
	err = r.incrementFavoritesCount(article.ArticleID, -1)
	if err != nil {
		return nil, fmt.Errorf("failed to decrement favorites count: %w", err)
	}
	
	// Return updated article
	return r.GetBySlug(slug, userID)
}

// Helper methods

// getSimilarSlugs gets all slugs that start with the given base slug
func (r *DynamoDBRepository) getSimilarSlugs(baseSlug string) ([]string, error) {
	result, err := r.dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(r.tableName),
		FilterExpression: aws.String("begins_with(slug, :slug)"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":slug": {S: aws.String(baseSlug)},
		},
	})
	
	if err != nil {
		return nil, err
	}
	
	var slugs []string
	for _, item := range result.Items {
		if slug, exists := item["slug"]; exists && slug.S != nil {
			slugs = append(slugs, *slug.S)
		}
	}
	
	return slugs, nil
}

// isArticleFavorited checks if a user has favorited an article with strong consistency
func (r *DynamoDBRepository) isArticleFavorited(userID, articleID string) (bool, error) {
	favorite := &models.Favorite{
		UserID:    userID,
		ArticleID: articleID,
	}
	favorite.SetFavoriteKeys()
	
	_, err := r.dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {S: aws.String(favorite.PK)},
			"SK": {S: aws.String(favorite.SK)},
		},
		ConsistentRead: aws.Bool(true), // Enable strong consistency for favorite status check
	})
	
	if err != nil {
		return false, err
	}
	
	return err == nil, nil
}

// incrementFavoritesCount increments or decrements the favorites count for an article with strong consistency
func (r *DynamoDBRepository) incrementFavoritesCount(articleID string, delta int) error {
	article := &models.Article{ArticleID: articleID}
	article.SetPrimaryKey()
	
	// Note: UpdateItem doesn't support ConsistentRead, but it provides strong consistency by default
	// The update operation will be immediately consistent for subsequent reads
	_, err := r.dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {S: aws.String(article.PK)},
			"SK": {S: aws.String(article.SK)},
		},
		UpdateExpression: aws.String("ADD favorites_count :delta"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":delta": {N: aws.String(strconv.Itoa(delta))},
		},
	})
	
	return err
}