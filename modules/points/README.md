# Points Module

This module handles employee points calculation and history tracking based on sales.

## Architecture

```
modules/points/
 ┣ infrastructure/                ← Prisma / DB access
 ┃ ┗ points.repository.ts
 ┣ application/                   ← Business logic (use cases)
 ┃ ┗ index.ts                     (finalizePointsForSale logic)
 ┣ server/                        ← Transport (server actions)
 ┃ ┗ actions.ts                   (future use)
 ┣ index.ts                       ← Barrel exports
 ┗ README.md
```

## Usage

```tsx
import { finalizePointsForSaleUseCase } from "@/modules/points";

// When a sale is completed/delivered
await finalizePointsForSaleUseCase(saleId);
```
