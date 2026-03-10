# Reports Module

This module handles the generation, aggregation, and visualization of various business reports, including time sales, product sales, customer sales, and salesperson performance.

## Architecture Status

⚠️ **Note on Architecture:** The `reports` module currently has an **empty** `infrastructure` folder because the Prisma database queries are heavily intertwined with business logic and data aggregations inside the `application` layer (e.g., in `get-reports.ts` and `get-sales-report.ts`).

To fully adhere to the [Clean Architecture Standard](../.agents/workflows/refactor-module-structure.md), these Prisma queries should eventually be extracted into `infrastructure/reports.repository.ts`.

### Current Structure

```
modules/reports/
 ┣ infrastructure/                    ← (Empty/Pending) Prisma queries should be moved here
 ┣ application/                       ← Business logic & Aggregations (currently includes DB queries)
 ┃ ┣ get-reports.ts
 ┃ ┣ get-sales-report.ts
 ┃ ┗ index.ts
 ┣ server/                            ← Transport layer (Next.js server actions)
 ┃ ┗ actions.ts
 ┣ features/                          ← UI screens and dashboards
 ┃ ┗ dashboard/
 ┃   ┗ time-sales-dashboard.tsx
 ┣ ui/                                ← Module-specific reusable UI components
 ┃ ┣ growth-badge.tsx
 ┃ ┗ kpi-card.tsx
 ┣ types/
 ┃ ┗ index.ts
 ┣ constants.ts                       ← Configuration, lookup arrays, and UI constants
 ┣ utils.ts                           ← Reusable functions (e.g., currency/number formatters)
 ┣ index.ts                           ← Barrel exports
 ┗ README.md
```

### Layer Responsibilities

| Layer             | Responsibility                                              |
| ----------------- | ----------------------------------------------------------- |
| `infrastructure/` | _(Pending Extraction)_ Pure Prisma/DB operations            |
| `application/`    | Complex aggregations, calculating growths, and data mapping |
| `server/`         | Server actions forwarding filters to application layer      |
| `features/`       | Main report UI screens, interactive charts, and dashboards  |
| `ui/`             | Reusable sub-components for reports (KPI Cards, Badges)     |
| `types/`          | TypeScript interfaces and payload definitions               |
| `constants.ts`    | Chart colors, Date dropdown options, Chart styles           |
| `utils.ts`        | Number syntax handling (K/M shortenings, THB formats)       |

## Components

### TimeSalesDashboard

A complex interactive dashboard analyzing sales across different time periods. It uses interactive inputs for date filtering and provides dynamic KPI cards, Daily Trend Area charts, and Seasonality Pie charts.

## Dependencies

- **`date-fns`**: Core utility for manipulating date ranges to filter database records.
- **`recharts`**: Rendering dashboards.
- **`@/components/ui/`**: Base design system (Cards, Buttons, Popovers, Calendars).
- **`Prisma Client`**: Used inside `application` to aggregate heavy records from `SaleOrder`.
