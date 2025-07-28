package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// DB represents the database connection
type DB struct {
	*sql.DB
}

// NewConnection creates a new database connection
func NewConnection() (*DB, error) {
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "./data/conduit.db"
	}

	// EFS 경로인 경우 디렉토리 생성 확인
	if filepath.Dir(dbPath) == "/mnt/efs" {
		if err := os.MkdirAll("/mnt/efs", 0755); err != nil {
			return nil, fmt.Errorf("failed to create EFS directory: %w", err)
		}
	}

	// WAL 모드 활성화 및 기본 설정 추가
	dsn := dbPath + "?_journal_mode=WAL&_synchronous=NORMAL&_cache_size=10000&_foreign_keys=ON"
	
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// 추가 SQLite 최적화 설정
	if err := optimizeSQLite(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to optimize SQLite: %w", err)
	}

	return &DB{db}, nil
}

// optimizeSQLite applies SQLite performance optimizations
func optimizeSQLite(db *sql.DB) error {
	optimizations := []string{
		"PRAGMA temp_store = memory;",
		"PRAGMA mmap_size = 268435456;", // 256MB
		"PRAGMA page_size = 32768;",     // 32KB pages
	}

	for _, stmt := range optimizations {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("failed to execute %s: %w", stmt, err)
		}
	}

	return nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}
