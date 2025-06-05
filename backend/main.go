package main

import (
	"net/http"
	"social-network/server"
)

func main() {
	var Router http.Handler

	server.InitialiseDB()
	// Initialize router
	Router = server.Routes()
	// Handle shutdown
	go server.Shutdown()
	// db cleanup routines
	go server.ResetDBRoutines()
	// Start the server
	server.Serve(Router)
}
