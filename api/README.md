# Api Service

A microservice built with Forge.

## Overview

Api provides RESTful API endpoints for managing api resources.

## API Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /api/v1/api` - List all items
- `POST /api/v1/api` - Create new item
- `GET /api/v1/api/:id` - Get specific item
- `PUT /api/v1/api/:id` - Update item
- `DELETE /api/v1/api/:id` - Delete item

## Development

```bash
# Build the service
forge build api

# Run tests
forge test api

# Run locally
forge run api
```

## Configuration

Configuration is managed via environment variables:

- `PORT` - HTTP server port (default: 8080)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `ENVIRONMENT` - Environment name (dev, staging, prod)

## Deployment

The service is automatically deployed via GitHub Actions on push to main branch.

See `.github/workflows/deploy-k8s.yml` for deployment configuration.
