# Hallmark Academy

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- Any auth/upload keys used by the app

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run dev server:
```bash
npm run dev
```

## Safe Prisma Workflow

Use this workflow for all schema changes to avoid drift.

1. Edit `prisma/schema.prisma`.
2. Create/apply migration locally:
```bash
npm run prisma:migrate -- --name <change_name>
```
3. Regenerate client if needed:
```bash
npm run prisma:generate
```
4. Seed if needed:
```bash
npm run prisma:seed
```
5. Commit both schema and migration files together:
- `prisma/schema.prisma`
- `prisma/migrations/*`

## Production Migration Workflow

Never run `migrate dev` in production.

1. Deploy app code containing committed migrations.
2. Run:
```bash
npm run prisma:deploy
```

## Rules To Prevent Drift

- Do not manually alter tables/enums/indexes in Supabase SQL editor for schema changes.
- Do not edit or delete already-applied migration files.
- Do not mix `prisma db push` with `prisma migrate dev` on the same database.
- Keep `DATABASE_URL` and `SHADOW_DATABASE_URL` stable in migration runs.
- Use a dedicated dev database; do not run local `migrate dev` on production DB.

## Drift Recovery (Development Only)

If Prisma reports drift and local data can be discarded:

```bash
npm run prisma:reset
npm run prisma:migrate -- --name recover_schema
npm run prisma:seed
```

If data must be preserved, do not reset. Inspect the DB diff and create a corrective migration instead.
