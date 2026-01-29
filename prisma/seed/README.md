# Database Seeding Strategy

## Current Structure

The seeding logic has been refactored into modular files in `prisma/seed/`:

- `clear.ts`: Clears all data (Dev only).
- `master.ts`: Companies, Departments, Master data.
- `product-master.ts`: Product categories, groups, chemical groups.
- `rbac.ts`: Roles and Permissions.
- `users.ts`: Default users.
- `index.ts`: Main entry point.

## Proposed Multi-Environment Strategy

To support Dev, Staging, and Production environments safely, we can implement a `SEED_MODE` environment variable strategy.

### 1. Development (Default)

- **Mode**: `dev`
- **Behavior**: Partial/Full Reset + Full Seed.
- **Action**: Runs `clear.ts` then seeds everything.
- **Command**:
  ```bash
  npm run seed
  # OR
  SEED_MODE=dev npm run seed
  ```

### 2. Staging

- **Mode**: `staging`
- **Behavior**: No Clear. Update Master Data & RBAC.
- **Action**: Skips `clear.ts`. Runs `master.ts` and `rbac.ts` (idempotent checks needed).
- **Command**:
  ```bash
  SEED_MODE=staging npm run seed
  ```

### 3. Production

- **Mode**: `production`
- **Behavior**: **Conservative Add-Only**.
- **Action**:
  - NEVER run `clear.ts`.
  - Only adds _missing_ permissions or roles.
  - Does not touch existing business data (Products, Companies, Users).
- **Command**:
  ```bash
  SEED_MODE=production npm run seed
  ```

## Recommended Implementation Plan

1. **Update `index.ts` to handle modes**:

   ```typescript
   const mode = process.env.SEED_MODE || "dev";

   if (mode === "dev") {
     await seedClear(prisma);
   }

   if (["dev", "staging"].includes(mode)) {
     await seedMaster(prisma);
     await seedProductMaster(prisma);
   }

   // RBAC runs in all modes, but Production version might need to be "Create Only"
   // We might need a separate 'seedRBACSafe' for production that uses upsert/connect
   await seedRBAC(prisma);

   if (mode === "dev") {
     await seedUsers(prisma);
   }
   ```

2. **Refactor `rbac.ts` for Safety**:
   - Currently, `rbac.ts` might assume clean state or use `create`.
   - For Production, ensure `upsert` or `findFirst` check is used to avoid Unique Constraint violations.

3. **CI/CD Integration**:
   - Configure the deployment pipeline to set the appropriate `SEED_MODE` var.
