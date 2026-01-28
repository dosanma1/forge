.PHONY: studio studio-web studio-app studio-build api frontend help

# Default target
help:
	@echo "Available targets:"
	@echo "  make studio       - Start Wails desktop app (recommended)"
	@echo "  make studio-web   - Start web mode (API + Angular in browser)"
	@echo "  make studio-app   - Alias for studio"
	@echo "  make studio-build - Build Wails desktop app binary"
	@echo "  make api          - Start only the API server (port 8080)"
	@echo "  make frontend     - Start only the Studio frontend (port 4200)"

# Start Wails desktop app (development mode with hot reload)
studio:
	@echo "Starting Forge Studio desktop app..."
	cd apps/studio && wails3 task dev

# Alias for studio
studio-app: studio

# Start web mode (API + Angular in browser) - legacy mode
studio-web:
	@echo "Starting Forge Studio in web mode..."
	@trap 'kill 0' EXIT; \
	$(MAKE) api & \
	$(MAKE) frontend & \
	wait

# Build Wails desktop app
studio-build:
	@echo "Building Forge Studio desktop app..."
	cd apps/studio && wails3 task build

# Start the Go API server
api:
	@echo "Starting API server on port 8080..."
	cd api && go run ./cmd/server/main.go

# Start the Angular Studio frontend
frontend:
	@echo "Starting Studio frontend on port 4200..."
	npx nx serve studio
