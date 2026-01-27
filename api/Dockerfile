# Multi-stage build for api
FROM golang:1.25-alpine AS builder

WORKDIR /workspace

# Copy go modules
COPY go.work ./
COPY backend/services/api/go.mod ./backend/services/api/
# Copy go.sum if it exists (glob pattern makes it optional)
COPY backend/services/api/go.su[m] ./backend/services/api/ || true

# Download dependencies
RUN cd backend/services/api && go mod download

# Copy source code
COPY backend/services/api/ ./backend/services/api/

# Build the binary
RUN cd backend/services/api && \
    CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Final stage
FROM gcr.io/distroless/static-debian12:latest

WORKDIR /app

COPY --from=builder /server /app/server

EXPOSE 8080

ENV PORT=8080

ENTRYPOINT ["/app/server"]
