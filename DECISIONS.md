
# DECISIONS

- DB: SQLite via Prisma (fast local setup). Switch to Postgres by changing provider.
- Framework: Fastify(Nodejs) for the API.
- Validation: Zod shared in packages/schemas.
- Timezone: Australia/Melbourne (use Luxon in domain logic).
- Auth: simple Bearer token required (non-empty) for demo.
- PDFs: omitted in starter (can be added later).
