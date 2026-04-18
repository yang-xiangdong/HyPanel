FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/hypanel ./cmd/server

FROM alpine:3.21

WORKDIR /app

COPY --from=builder /out/hypanel /usr/local/bin/hypanel

EXPOSE 8080

CMD ["hypanel"]
