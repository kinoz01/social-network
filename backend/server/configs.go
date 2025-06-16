package server

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"path/filepath"

	// "strings"
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

	// Replace backslashes with forward slashes for Windows file paths
	// absPath = strings.ReplaceAll(absPath, "\\", "/")

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

// Reallow users to send group invitations after 15 days.
// Reallow users to send group requests after 15 days.
func ResetDBRoutines() {
	for {
		time.Sleep(48 * time.Hour) // Run every 2 days

		log.Println("Running DB rejects cleanup...")
		_, err1 := db.DB.Exec(`
			DELETE FROM group_invitations
			WHERE status = 'rejected' AND invited_at <= DATETIME('now', '-15 days')
		`)
		_, err2 := db.DB.Exec(`
			DELETE FROM group_requests
			WHERE status = 'rejected' AND created_at <= DATETIME('now', '-15 days')
		`)
		if err1 != nil || err2 != nil {
			log.Println("Cleanup errors:", err1, err2)
		} else {
			log.Println("DB rejects cleanup completed.")
		}
	}
}
