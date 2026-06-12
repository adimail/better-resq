FROM golang:1.25-alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
RUN go install github.com/pressly/goose/v3/cmd/goose@latest
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /resq-server ./cmd/resq-server

FROM alpine:3.21
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata postgresql-client
COPY --from=builder /resq-server .
COPY --from=builder /go/bin/goose /usr/local/bin/goose
COPY --from=builder /app/sql/migrations ./sql/migrations
COPY --from=builder /app/entrypoint.sh .
RUN chmod +x entrypoint.sh
ENV GIN_MODE=release
EXPOSE 8080
ENTRYPOINT ["./entrypoint.sh"]

