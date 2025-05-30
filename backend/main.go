package main

import (
	"social-network/server"
)

func main() {
	server.InitialiseDB()
	// Initialize router
	server.Router = server.Routes()
	// Handle shutdown
	go server.Shutdown()
	// db cleanup routines
	go server.ResetDBRoutines()
	// Start the server
	server.Serve(server.Router)
}
