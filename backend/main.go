package main

import (
	database "social-network/database/sqlite"
	"social-network/server"
)

func main() {
	database.InitialiseDB()
	// Initialize router
	Router := server.Routes()
	// Handle shutdown
	go server.Shutdown()
	// Start the server
	server.Serve(Router)
}