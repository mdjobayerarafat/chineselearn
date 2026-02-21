# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
# CGO_ENABLED=1 is required for sqlite3
RUN CGO_ENABLED=1 GOOS=linux go build -o main .

# Run stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache sqlite-libs

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Copy existing database if it exists (for initial setup)
# Note: We'll use a volume mount in docker-compose for persistence
COPY --from=builder /app/chineselearn.db ./chineselearn.db

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]
