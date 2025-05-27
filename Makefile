# Run everything
run: check-npm check-nextjs kill-ports run-backend run-frontend
	@echo "Live and running!"

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

#------------------------- Docker -------------------------#
buildDocker:
	-docker-compose down --volumes --remove-orphans
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
#------------------------- Docker -------------------------#

#------------------------ Migration -----------------------#
# Check if golang-migrate is installed
check-migrate:
	@command -v migrate >/dev/null 2>&1 || { \
		echo "🔴 golang-migrate is not installed."; \
		echo "➡️  Install from: https://github.com/golang-migrate/migrate"; \
		echo "➡️  Or use: curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz"; \
		echo "and: sudo mv migrate /usr/local/bin/"; \
		exit 1; \
	}
	@echo "golang-migrate is installed."

# Create SQLite migration files for all tables
migrate-sqlite:
	- check-migrate
	@echo "Creating migrations in ./backend/database/migrations/sqlite"
	@tables="users sessions posts comments follow_requests post_privacy like_reaction private_chats groups group_users group_chats group_events event_responses notifications"; \
	for t in $$tables; do \
		echo "- creating $$t"; \
		migrate create -seq -ext sql -dir "./backend/database/migrations/sqlite" "create_$${t}_table"; \
	done; \
	echo "Created $$(echo $$tables | wc -w) table migrations"

users:
	@echo "Generating users_insert.sql with static IDs (uuid-1 to uuid-x)..."
	@echo "INSERT INTO users (id, email, username, password, first_name, last_name, birthday, about_me, profile_pic, account_type, created_at) VALUES" > users_insert.sql
	@for i in $$(seq 1 7001); do \
		end=$$(test $$i -eq 7001 && echo ";" || echo ","); \
		echo "('uuid-$$i','aaa$$i@example.com','aaa$$i','\$$2b\$$10\$$z4Pf6EjZPcwJuGdH83zEIOXYOB6jzyOPlFqzAf9MiTzVJ7GyaH0Ca','aaaa','aaaa','1995-01-01','','avatar.webp','public',CURRENT_TIMESTAMP)$$end" >> users_insert.sql; \
	done
	@echo "✅ users_insert.sql generated with x static UUIDs."


followers:
	@echo "Generating follow_requests.sql with uuid-1 to uuid-x as followers..."
	@echo "INSERT INTO follow_requests (id, follower_id, followed_id, status, created_at) VALUES" > follow_requests.sql
	@for i in $$(seq 1 7001); do \
		end=$$(test $$i -eq 7001 && echo ";" || echo ","); \
		echo "('foll-$$i','uuid-$$i','0c01c9b9-fbcc-41f1-af8f-73ddd53e5845','accepted',CURRENT_TIMESTAMP)$$end" >> follow_requests.sql; \
	done
	@echo "✅ follow_requests.sql generated with x accepted follow requests."

group_users:
	@echo "Generating group_users_insert.sql with static IDs (uuid-1 to uuid-7001)..."
	@echo "INSERT INTO group_users (id, group_id, users_id) VALUES" > group_users_insert.sql
	@for i in $$(seq 1 7001); do \
		end=$$(test $$i -eq 7001 && echo ";" || echo ","); \
		echo "('gu-$$i','e2cfe1f0-fc0b-459b-953c-8cb2e8ccb100','uuid-$$i')$$end" >> group_users_insert.sql; \
	done
	@echo "✅ group_users_insert.sql generated with 7001 entries."

