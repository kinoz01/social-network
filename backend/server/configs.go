package server

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	// Import the SQLite3 driver

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/mattn/go-sqlite3"

	db "social-network/handlers/types"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// create/open DB and create tables if they aren't already created.
func InitialiseDB() {
	var err error
	db.DB, err = sql.Open("sqlite3", "./database/socNet.db")
	if err != nil {
		log.Fatal("Failed to open SQLite database:", err)
	}

	if err = db.DB.Ping(); err != nil {
		log.Fatal("connection to the database is dead.", err)
	}

	// Connection pool configuration
	db.DB.SetMaxOpenConns(10)                 // Simultaneously opened connections
	db.DB.SetMaxIdleConns(5)                  // Reuse some opened connections
	db.DB.SetConnMaxLifetime(5 * time.Minute) // Remove stale connections

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
