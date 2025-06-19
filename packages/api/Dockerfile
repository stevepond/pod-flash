FROM node:20-slim

WORKDIR /app

# Install pnpm and typescript globally
RUN apt-get update && apt-get install -y python3 make g++ netcat-openbsd && \
    npm install -g pnpm typescript

# Copy only the lockfile and package.jsons first for better caching
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/api/tsconfig.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/

# Install dependencies (links workspaces)
RUN pnpm install

# Copy the rest of the monorepo
COPY packages ./packages

# Build shared first
WORKDIR /app/packages/shared
RUN pnpm build

# Build api
WORKDIR /app/packages/api
RUN pnpm build

# Debug: List the contents of dist/temporal after build
RUN ls -l /app/packages/api/dist/temporal || true

# Copy wait-for-it script
COPY packages/api/wait-for-it.sh ./wait-for-it.sh
RUN chmod +x ./wait-for-it.sh

# Set the working directory back to the API package
WORKDIR /app/packages/api

EXPOSE 3000

# Use wait-for-it to wait for Temporal before starting the API
ENTRYPOINT ["/app/packages/api/wait-for-it.sh", "temporal", "7233", "pnpm", "start"] 