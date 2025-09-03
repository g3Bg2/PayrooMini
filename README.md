
# Payroo Mini Payrun — Starter Monorepo
This is a minimal starter skeleton for the Payroo Mini Payrun coding assessment.

Folders:
- `api/` — Node.js + TypeScript Fastify API (Prisma + SQLite)
- `web/` — Vite + React + TypeScript minimal UI
- `packages/schemas/` — shared Zod schemas and types
- `prisma/data/` — sample employees/timesheets JSON for seeding

## Environment Setup
Clone .env.example to .env in both /api and /web directories:
```bash
#backend
cd /api
cp .env.example .env

#fronted
cd /web
cp .env.example .env
```

## Quick start in Local (requires Node 18+, pnpm recommended)
```bash
# from repo root
pnpm install
# Generate Prisma client
cd api
# local
pnpm prisma migrate dev --name init --schema=prisma/schema.dev.prisma

# production(postgresDB)
pnpm prisma migrate dev --name init --schema=prisma/schema.prod.prisma

# Seed DB (creates SQLite dev.db)
pnpm seed
## Note: paste the seed.ts(attached in email) file in prisma folder and run the above command

# Run API (dev)
pnpm dev

# Run Web
cd ../web
pnpm dev

# Or after running the `seed` in api run both frontend and backend from root cd ..
pnpm dev
```
