# Check if npm is installed
check-npm:
	@command -v npm >/dev/null 2>&1 || { \
		echo "nodejs/npm is not installed."; \
		echo "🔴 Try installing using: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"; \
		exit 1; \
	}
	@echo "nodejs & npm are installed."

# Check if Next.js is installed
check-nextjs:
	@if [ ! -d "frontend/node_modules/next" ]; then \
		echo "🔴 Next.js is not installed. Installing now..."; \
		cd frontend && npm install; \
	else \
		echo "Next.js is installed."; \
	fi

# Kill processes on ports 8080 (backend) and 3000 (frontend) if running
kill-ports:
	-docker-compose down --volumes --remove-orphans
	@echo "Checking for running services on ports 8080 and 3000..."
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "No process on port 8080"
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process on port 3000"


# Run backend on background
run-backend:
	@echo "Starting Go backend..."
	@cd backend && go run main.go &

# Run backend.
go:
	@echo "Starting Go backend..."
	@cd backend && go run main.go

# Run frontend
run-frontend:
	@echo "Starting Next.js frontend..."
	cd frontend && npm run dev

# Run everything
run: check-npm check-nextjs kill-ports run-backend run-frontend
	@echo "Live and running!"


#------------------------- Docker -------------------------#
buildDocker: kill-ports
	docker-compose up --build

# Stop and remove backend and frontend containers
cleanDocker:
	-docker stop $(docker-compose ps -q backend) $(docker compose ps -q frontend)
	-docker rm $(docker-compose ps -q backend) $(docker compose ps -q frontend)
	-docker rmi $(docker images -q backend) $(docker images -q frontend)
	-docker system prune -f --volumes

# Stop and clean up All Docker resources
deepClean:
	-docker stop $$(docker ps -aq)
	-docker rm $$(docker ps -aq)
	-docker rmi $$(docker images -q)
	-docker system prune -a -f --volumes
