package repository

import (
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
	"github.com/vibe-coding-paradigm/realworld-serverless-auth/models"
)

// DynamoDBRepository handles user data operations with DynamoDB
type DynamoDBRepository struct {
	dynamoClient *dynamodb.DynamoDB
	tableName    string
}

// NewDynamoDBRepository creates a new DynamoDB repository
func NewDynamoDBRepository() (*DynamoDBRepository, error) {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("ap-northeast-2"), // Seoul region as specified in CDK
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %w", err)
	}

	tableName := os.Getenv("USERS_TABLE_NAME")
	if tableName == "" {
		return nil, fmt.Errorf("USERS_TABLE_NAME environment variable is not set")
	}

	return &DynamoDBRepository{
		dynamoClient: dynamodb.New(sess),
		tableName:    tableName,
	}, nil
}

// Create creates a new user in DynamoDB
func (r *DynamoDBRepository) Create(user *models.User) error {
	// Generate UUID for user
	user.UserID = uuid.New().String()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.SetDynamoDBKeys()

	// Marshal user to DynamoDB attributes
	av, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	// Also add GSI attributes for email and username lookups
	av["email"] = &dynamodb.AttributeValue{S: aws.String(user.Email)}
	av["username"] = &dynamodb.AttributeValue{S: aws.String(user.Username)}

	// Put item to DynamoDB
	_, err = r.dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      av,
		ConditionExpression: aws.String("attribute_not_exists(PK)"), // Prevent overwrites
	})

	if err != nil {
		return fmt.Errorf("failed to create user in DynamoDB: %w", err)
	}

	return nil
}

// GetByEmail retrieves a user by email using GSI
func (r *DynamoDBRepository) GetByEmail(email string) (*models.User, error) {
	result, err := r.dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		IndexName:              aws.String("EmailIndex"),
		KeyConditionExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(email)},
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to query user by email: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	var user models.User
	err = dynamodbattribute.UnmarshalMap(result.Items[0], &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}

	return &user, nil
}

// GetByUsername retrieves a user by username using GSI
func (r *DynamoDBRepository) GetByUsername(username string) (*models.User, error) {
	result, err := r.dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		IndexName:              aws.String("UsernameIndex"),
		KeyConditionExpression: aws.String("username = :username"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":username": {S: aws.String(username)},
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to query user by username: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	var user models.User
	err = dynamodbattribute.UnmarshalMap(result.Items[0], &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}

	return &user, nil
}

// GetByID retrieves a user by ID with strong consistency
func (r *DynamoDBRepository) GetByID(userID string) (*models.User, error) {
	result, err := r.dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"PK": {S: aws.String("USER#" + userID)},
			"SK": {S: aws.String("PROFILE")},
		},
		ConsistentRead: aws.Bool(true), // Enable strong consistency for immediate read after write
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	if result.Item == nil {
		return nil, fmt.Errorf("user not found")
	}

	var user models.User
	err = dynamodbattribute.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}

	return &user, nil
}

// EmailExists checks if an email already exists
func (r *DynamoDBRepository) EmailExists(email string) (bool, error) {
	result, err := r.dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		IndexName:              aws.String("EmailIndex"),
		KeyConditionExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(email)},
		},
		Select: aws.String("COUNT"),
	})

	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}

	return *result.Count > 0, nil
}

// UsernameExists checks if a username already exists
func (r *DynamoDBRepository) UsernameExists(username string) (bool, error) {
	result, err := r.dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		IndexName:              aws.String("UsernameIndex"),
		KeyConditionExpression: aws.String("username = :username"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":username": {S: aws.String(username)},
		},
		Select: aws.String("COUNT"),
	})

	if err != nil {
		return false, fmt.Errorf("failed to check username existence: %w", err)
	}

	return *result.Count > 0, nil
}