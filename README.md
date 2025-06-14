# Pod Flash

Monorepo for Podcast Digest application. Includes API server, React UI, shared utilities, and infrastructure via docker-compose.

## Packages
- `packages/api` – Express API server written in TypeScript
- `packages/ui` – React front-end built with Vite
- `packages/shared` – Shared TypeScript types
- `infra` – docker-compose services (Temporal, Cassandra, MinIO)

## Development

Install dependencies with `pnpm install` and start development servers:

```bash
pnpm dev
```

Build all packages:

```bash
pnpm build
```
