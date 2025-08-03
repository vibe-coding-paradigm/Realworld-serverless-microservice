package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"github.com/vibe-coding-paradigm/conduit-comments/models"
)

// SQLiteComment represents a comment from SQLite database
type SQLiteComment struct {
	ID        string    `db:"id"`
	Body      string    `db:"body"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	AuthorUsername string `db:"username"`
	ArticleSlug    string `db:"slug"`
}

func main() {
	// Check command line arguments
	if len(os.Args) < 3 {
		log.Fatal("Usage: go run migrate_comments.go <sqlite_db_path> <dynamodb_table_name>")
	}

	sqliteDBPath := os.Args[1]
	dynamoTableName := os.Args[2]

	log.Printf("Starting comment migration from %s to DynamoDB table %s", sqliteDBPath, dynamoTableName)

	// Open SQLite database
	sqliteDB, err := sql.Open("sqlite3", sqliteDBPath)
	if err != nil {
		log.Fatalf("Failed to open SQLite database: %v", err)
	}
	defer sqliteDB.Close()

	// Initialize DynamoDB client
	sess, err := session.NewSession()
	if err != nil {
		log.Fatalf("Failed to create AWS session: %v", err)
	}
	dynamoDB := dynamodb.New(sess)

	// Migrate comments
	if err := migrateComments(sqliteDB, dynamoDB, dynamoTableName); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("Comment migration completed successfully!")
}

func migrateComments(sqliteDB *sql.DB, dynamoDB *dynamodb.DynamoDB, tableName string) error {
	// Query to get all comments with article and author information
	query := `
		SELECT c.id, c.body, c.created_at, c.updated_at, 
		       u.username, a.slug
		FROM comments c
		JOIN users u ON c.author_id = u.id
		JOIN articles a ON c.article_id = a.id
		ORDER BY c.created_at ASC
	`

	rows, err := sqliteDB.Query(query)
	if err != nil {
		return fmt.Errorf("failed to query SQLite comments: %w", err)
	}
	defer rows.Close()

	var totalCount, successCount, errorCount int

	for rows.Next() {
		totalCount++
		
		var sqliteComment SQLiteComment
		err := rows.Scan(
			&sqliteComment.ID,
			&sqliteComment.Body,
			&sqliteComment.CreatedAt,
			&sqliteComment.UpdatedAt,
			&sqliteComment.AuthorUsername,
			&sqliteComment.ArticleSlug,
		)
		if err != nil {
			log.Printf("Failed to scan SQLite comment %d: %v", totalCount, err)
			errorCount++
			continue
		}

		// Convert to DynamoDB format
		dynamoComment := &models.Comment{
			ID:             sqliteComment.ID,
			CreatedAt:      sqliteComment.CreatedAt,
			UpdatedAt:      sqliteComment.UpdatedAt,
			Body:           sqliteComment.Body,
			PK:             "ARTICLE#" + sqliteComment.ArticleSlug,
			SK:             "COMMENT#" + sqliteComment.ID,
			ArticleSlug:    sqliteComment.ArticleSlug,
			AuthorUsername: sqliteComment.AuthorUsername,
		}

		// Insert into DynamoDB
		err = insertCommentToDynamoDB(dynamoDB, tableName, dynamoComment)
		if err != nil {
			log.Printf("Failed to insert comment %s: %v", sqliteComment.ID, err)
			errorCount++
			continue
		}

		successCount++
		if successCount%10 == 0 {
			log.Printf("Migrated %d/%d comments...", successCount, totalCount)
		}
	}

	if err = rows.Err(); err != nil {
		return fmt.Errorf("error iterating SQLite comments: %w", err)
	}

	log.Printf("Migration summary:")
	log.Printf("  Total comments processed: %d", totalCount)
	log.Printf("  Successfully migrated: %d", successCount)
	log.Printf("  Errors: %d", errorCount)

	if errorCount > 0 {
		return fmt.Errorf("migration completed with %d errors", errorCount)
	}

	return nil
}

func insertCommentToDynamoDB(dynamoDB *dynamodb.DynamoDB, tableName string, comment *models.Comment) error {
	// Marshal the comment to DynamoDB format
	item, err := dynamodbattribute.MarshalMap(comment)
	if err != nil {
		return fmt.Errorf("failed to marshal comment: %w", err)
	}

	// Insert the item
	input := &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
		// Use condition to prevent overwriting existing comments
		ConditionExpression: aws.String("attribute_not_exists(PK)"),
	}

	_, err = dynamoDB.PutItem(input)
	if err != nil {
		return fmt.Errorf("failed to put item: %w", err)
	}

	return nil
}

// Additional helper for migration verification
func verifyMigration(sqliteDB *sql.DB, dynamoDB *dynamodb.DynamoDB, tableName string) error {
	// Count comments in SQLite
	var sqliteCount int
	err := sqliteDB.QueryRow("SELECT COUNT(*) FROM comments").Scan(&sqliteCount)
	if err != nil {
		return fmt.Errorf("failed to count SQLite comments: %w", err)
	}

	// Count items in DynamoDB table
	scanInput := &dynamodb.ScanInput{
		TableName: aws.String(tableName),
		Select:    aws.String("COUNT"),
	}

	scanResult, err := dynamoDB.Scan(scanInput)
	if err != nil {
		return fmt.Errorf("failed to count DynamoDB comments: %w", err)
	}

	dynamoCount := int(*scanResult.Count)

	log.Printf("Verification results:")
	log.Printf("  SQLite comments: %d", sqliteCount)
	log.Printf("  DynamoDB comments: %d", dynamoCount)

	if sqliteCount != dynamoCount {
		return fmt.Errorf("count mismatch: SQLite=%d, DynamoDB=%d", sqliteCount, dynamoCount)
	}

	log.Println("✅ Migration verification passed!")
	return nil
}