# Get typst binary from official image
FROM ghcr.io/typst/typst:latest AS typst

# Build stage - build Astro site
FROM node:22-alpine AS builder

# Copy typst binary
COPY --from=typst /bin/typst /usr/local/bin/typst

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY astro.config.mjs tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/

# Build the site (astro build && pagefind)
ARG GOOGLE_CREDENTIALS_BASE64
ENV GOOGLE_CREDENTIALS_BASE64=$GOOGLE_CREDENTIALS_BASE64
RUN pnpm build

# Production stage - serve with nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --chmod=644 --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
