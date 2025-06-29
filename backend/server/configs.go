package server

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	db "social-network/handlers/types"
)

// Listens for termination signals and ensures the DB is closed before exiting.
func Shutdown() {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	<-stop //- stops here until an interrupt signal is received
	log.Println("shutting down server...")
	if err := db.DB.Close(); err != nil {
		log.Fatal("Error closing DB:", err)
	}
	os.Exit(0)
}
