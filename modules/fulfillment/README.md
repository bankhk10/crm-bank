# Fulfillment Module

This module manages the fulfillment process, including order status management, picking/packing (LOT selection), partial deliveries (Split Shipments), and delivery tracking. It primarily interacts with existing Sales and Inventory data.

## Architecture (Employee Pattern)

This module follows a layered architecture (Clean Architecture pattern) to separate business logic from UI and external dependencies:

```
modules/fulfillment/
 ┣ features/                      ← UI screens and Custom Hooks
 ┃ ┣ detail-view/                 (e.g., fulfillment-detail-view.tsx)
 ┃ ┣ form/                        (e.g., lot-selector.tsx)
 ┃ ┗ list-view/                   (e.g., fulfillment-list-view.tsx, use-fulfillment-list.ts)
 ┃
 ┣ application/                   ← Use Cases (Business Logic)
 ┃ ┣ create-shipment.ts
 ┃ ┣ get-lot-options.ts
 ┃ ┣ update-fulfillment.ts
 ┃ ┣ update-shipment.ts
 ┃ ┗ validations.ts               (Zod schemas)
 ┃
 ┣ server/                        ← Transport (Server Actions only)
 ┃ ┗ actions.ts
 ┃
 ┣ infrastructure/                ← Prisma / Database Access
 ┃ ┣ fulfillment.repository.ts
 ┃ ┗ shipment.repository.ts
 ┃
 ┣ ui/                            ← Module-specific UI components
 ┣ types/                         ← TypeScript types
 ┣ constants.ts                   ← Statuses and constants
 ┗ index.ts                       ← Barrel exports
```

### Layer Responsibilities

1. **Infrastructure (`infrastructure/`)**: Contains pure database operations (Prisma queries/mutations). No business logic, validation, or authentication checks.
2. **Application (`application/`)**: Contains the core business logic (Use Cases). Handles complex logic such as calculating prices, coordinating stock deductions, restoring credit limits, and interacting with other modules.
3. **Server (`server/actions.ts`)**: Next.js Server Actions (`"use server"`). Only responsible for Auth/Permission checks, calling Use Cases, and path revalidation (`revalidatePath`). No business logic here.
4. **Features (`features/`)**: Contains React components grouped by screens (list, detail, form). UI components use custom hooks (e.g., `use-fulfillment-list.ts`) to manage state and fetch data, separating UI rendering from state management.

---

## Key Features

1. **Lot Selection**: Warehouse staff can select specific inventory Lots for each item in a Sale. Auto-suggests lots based on First-In-First-Out (FIFO) logic.
2. **Partial Deliveries (Split Shipments)**: Allows fulfilling a single sale over multiple shipments if stock is insufficient or due to logistics.
3. **Status Management**: Tracks the lifecycle of a sale through various fulfillment states (`AWAITING_DELIVERY`, `PARTIALLY_DELIVERED`, `IN_TRANSIT`, `DELIVERED`, `COMPLETED`).
4. **Inventory & Credit Integration**: Automatically deducts physical/reserved stock upon shipment, and restores credit limits upon completion or cancellation.

---

## Database Entities

- **`Sale`**: The main order being fulfilled.
- **`Shipment`**: Represents a physical delivery of items (supports multiple shipments per Sale).
- **`ShipmentItem`**: The items and quantities packed in a specific shipment.
- **`InventoryTransaction`**: Records of stock movement (created via Use Cases).

---

## Component Props

### `FulfillmentTable`

Displays list of sales ready for fulfillment or in transit.

| Prop | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `sales` | `SaleRecord[]` | ✅ | List of sales data |
| `total` | `number` | ✅ | Total count for pagination |
| `page` | `number` | ✅ | Current page |
| `perPage` | `number` | ✅ | Items per page |
| `onPageChange` | `(page: number) => void` | ✅ | Page change handler |
| `onSearchChange` | `(val: string) => void` | ✅ | Search handler |

### `LotSelector`

Interactive component for warehouse staff to select specific inventory Lots for each item in a Sale.

| Prop | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `saleId` | `string` | ✅ | Target Sale ID |
| `onAllocationsChange` | `(allocations, isValid) => void` | ✅ | Callback when user selects lots |
| `disabled` | `boolean` | ❌ | Read-only mode |

---

## Types

### `LotAllocation`

```typescript
interface LotAllocation {
  saleItemId: string;
  lotId: string;
  quantity: number;
}
```

### `LotInfo`

```typescript
interface LotInfo {
  id: string;
  lotNumber: string;
  quantity: number;
  expiryDate?: Date | string | null;
  productId: string;
}
```
