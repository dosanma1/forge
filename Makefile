.PHONY: studio api frontend help

# Default target
help:
	@echo "Available targets:"
	@echo "  make studio   - Start both API and Studio frontend for development"
	@echo "  make api      - Start only the API server (port 8080)"
	@echo "  make frontend - Start only the Studio frontend (port 4200)"

# Start both API and Studio frontend concurrently
studio:
	@echo "Starting Forge Studio development environment..."
	@trap 'kill 0' EXIT; \
	$(MAKE) api & \
	$(MAKE) frontend & \
	wait

# Start the Go API server
api:
	@echo "Starting API server on port 8080..."
	cd api && go run ./cmd/server/main.go

# Start the Angular Studio frontend
frontend:
	@echo "Starting Studio frontend on port 4200..."
	npx nx serve studio
