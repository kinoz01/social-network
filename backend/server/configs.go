package server

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/mattn/go-sqlite3"

	db "social-network/handlers/types"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// create/open DB and run migration
func InitialiseDB() {
	var err error
	db.DB, err = sql.Open(
		"sqlite3",
		"file:./database/socNet.db?_foreign_keys=1")
	if err != nil {
		log.Fatal("Failed to open SQLite database:", err)
	}

	// Enable WAL mode (read/write concurrency)
	_, err = db.DB.Exec("PRAGMA journal_mode=WAL;")
	if err != nil {
		log.Fatal("Failed to enable WAL mode:", err)
	}

	runMigrations("./database/socNet.db")
}

// Applies database migrations using golang-migrate.
func runMigrations(databasePath string) {
    absPath, err := filepath.Abs("./database/migrations/sqlite")
    if err != nil {
        log.Fatalf("Could not get absolute path: %v", err)
    }

    m, err := migrate.New(
        "file://"+absPath,
        "sqlite3://"+databasePath,
    )
    if err != nil {
        log.Fatalf("Error loading migrations: %v", err)
    }

    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        log.Fatalf("Migration failed: %v", err)
    } else if err == migrate.ErrNoChange {
        log.Println("No new migrations to apply")
    } else {
        log.Println("Migrations applied successfully")
    }
}

// Listens for termination signals and ensures the DB is closed before exiting.
func Shutdown() {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	<-stop
	log.Println("shutting down server...")
	if err := db.DB.Close(); err != nil {
		log.Fatal("Error closing DB:", err)
	}
	os.Exit(0)
}
