package repository

import (
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/vibe-coding-paradigm/conduit-comments/models"
)

// DynamoDBRepository implements comment repository using DynamoDB
type DynamoDBRepository struct {
	db        *dynamodb.DynamoDB
	tableName string
}

// NewDynamoDBRepository creates a new DynamoDB repository
func NewDynamoDBRepository(tableName string) (*DynamoDBRepository, error) {
	sess, err := session.NewSession()
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %w", err)
	}

	return &DynamoDBRepository{
		db:        dynamodb.New(sess),
		tableName: tableName,
	}, nil
}

// ListCommentsByArticle retrieves all comments for a specific article with strong consistency
func (r *DynamoDBRepository) ListCommentsByArticle(articleSlug string) ([]models.Comment, error) {
	input := &dynamodb.QueryInput{
		TableName: aws.String(r.tableName),
		KeyConditionExpression: aws.String("PK = :pk AND begins_with(SK, :sk)"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":pk": {
				S: aws.String("ARTICLE#" + articleSlug),
			},
			":sk": {
				S: aws.String("COMMENT#"),
			},
		},
		ScanIndexForward: aws.Bool(true), // Sort by SK ascending (oldest first)
		ConsistentRead: aws.Bool(true),   // Enable strong consistency for immediate read after write
	}

	result, err := r.db.Query(input)
	if err != nil {
		return nil, fmt.Errorf("failed to query comments: %w", err)
	}

	// Initialize with empty slice to ensure JSON serialization returns [] not null
	comments := make([]models.Comment, 0)
	for _, item := range result.Items {
		var comment models.Comment
		err := dynamodbattribute.UnmarshalMap(item, &comment)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal comment: %w", err)
		}
		comments = append(comments, comment)
	}

	return comments, nil
}

// CreateComment creates a new comment
func (r *DynamoDBRepository) CreateComment(comment *models.Comment) error {
	item, err := dynamodbattribute.MarshalMap(comment)
	if err != nil {
		return fmt.Errorf("failed to marshal comment: %w", err)
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      item,
		ConditionExpression: aws.String("attribute_not_exists(PK)"), // Prevent overwriting
	}

	_, err = r.db.PutItem(input)
	if err != nil {
		return fmt.Errorf("failed to create comment: %w", err)
	}

	return nil
}

// GetComment retrieves a specific comment by article slug and comment ID with strong consistency
func (r *DynamoDBRepository) GetComment(articleSlug, commentID string) (*models.Comment, error) {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {
				S: aws.String("ARTICLE#" + articleSlug),
			},
			"SK": {
				S: aws.String("COMMENT#" + commentID),
			},
		},
		ConsistentRead: aws.Bool(true), // Enable strong consistency for immediate read after write
	}

	result, err := r.db.GetItem(input)
	if err != nil {
		return nil, fmt.Errorf("failed to get comment: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("comment not found")
	}

	var comment models.Comment
	err = dynamodbattribute.UnmarshalMap(result.Item, &comment)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal comment: %w", err)
	}

	return &comment, nil
}

// DeleteComment deletes a comment by article slug and comment ID
func (r *DynamoDBRepository) DeleteComment(articleSlug, commentID string) error {
	input := &dynamodb.DeleteItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {
				S: aws.String("ARTICLE#" + articleSlug),
			},
			"SK": {
				S: aws.String("COMMENT#" + commentID),
			},
		},
		ConditionExpression: aws.String("attribute_exists(PK)"), // Ensure item exists
	}

	_, err := r.db.DeleteItem(input)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	return nil
}

// GetUserByUsername retrieves user information from the users table (for author info)
func (r *DynamoDBRepository) GetUserByUsername(username string) (*models.Author, error) {
	// This would typically query a separate users table or service
	// For now, return a basic author structure
	// TODO: Implement proper user lookup from Users table/service
	return &models.Author{
		Username:  username,
		Bio:       "",
		Image:     "",
		Following: false,
	}, nil
}