# syntax = docker/dockerfile:1.6

FROM golang:1.24-alpine AS backend-builder
WORKDIR /backend
RUN apk add --no-cache gcc musl-dev
ENV CGO_ENABLED=1
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend .
RUN go build -o /out/socNet ./main.go
RUN mkdir -p /out && cp -r ./database /out/ && cp -r ./storage /out/

FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend .
ARG NEXT_PUBLIC_BACKEND_ORIGIN
ENV NEXT_PUBLIC_BACKEND_ORIGIN=$NEXT_PUBLIC_BACKEND_ORIGIN
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache sqlite bash caddy
COPY --from=backend-builder /out/socNet ./backend/socNet
COPY --from=backend-builder /out/database ./bootstrap/database
COPY --from=backend-builder /out/storage ./backend/storage
COPY --from=frontend-builder /frontend/.next ./frontend/.next
COPY --from=frontend-builder /frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /frontend/package.json ./frontend/package.json
COPY --from=frontend-builder /frontend/public ./frontend/public
COPY scripts/start-backend.sh ./scripts/start-backend.sh
COPY scripts/start-edge.sh ./scripts/start-edge.sh
COPY Caddyfile ./Caddyfile
RUN chmod +x ./scripts/start-backend.sh ./scripts/start-edge.sh
EXPOSE 3000 8080 3001
