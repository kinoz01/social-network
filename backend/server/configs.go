package server

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	// Import the SQLite3 driver
	_ "github.com/mattn/go-sqlite3"

	db "social-network/handlers/types"
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

	content, err := os.ReadFile("./database/schema.sql")
	if err != nil {
		log.Fatal("Failed to get database tables:", err)
	}

	if _, err := db.DB.Exec(string(content)); err != nil {
		log.Fatal("Failed to create database tables:", err)
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
