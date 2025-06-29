package server

import (
	"log"
	"net"
	"net/http"
	"time"
)

var Port = "8080"

// Starts the HTTP server
func Serve(handler http.Handler) {
	listener, err := net.Listen("tcp", ":"+Port)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}

	httpServer := &http.Server{
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,  // Headers must arrive within 5s //- resource exhaustion attacks
		ReadTimeout:       5 * time.Second,  // Prevent slow-client attacks
		WriteTimeout:      5 * time.Second,  // Protect from server hanging
		IdleTimeout:       15 * time.Second, // Reduce unauthorised access
	}

	log.Printf("Starting server on http://127.0.0.1:%s", Port)
	if err := httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
		log.Printf("Server error: %v", err)
	}

}
