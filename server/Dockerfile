# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -o /out/loop-server ./cmd/server
# goose CLI ships in the runtime image so the pre-deploy migration Job can run
# against the exact code being released (matches deploy/deploy.sh's tooling).
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go install github.com/pressly/goose/v3/cmd/goose@latest

FROM alpine:3.20
RUN apk add --no-cache ca-certificates && \
    addgroup -S loop && adduser -S loop -G loop
WORKDIR /app
COPY --from=builder /out/loop-server ./loop-server
COPY --from=builder /root/go/bin/goose ./goose
COPY db/migrations ./migrations
USER loop
EXPOSE 8080
ENTRYPOINT ["./loop-server"]
