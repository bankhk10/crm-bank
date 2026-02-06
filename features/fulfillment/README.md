# Fulfillment Feature

This module manages the fulfillment process, including order status management, picking/packing (LOT selection), and delivery tracking. It primarily interacts with existing Sales and Inventory data.

## Directory Structure

- `_components/`: UI components (FulfillmentTable, LotSelector, Cards, etc.)
- `_hooks/`: Custom hooks (useFulfillmentColumns)
- `_lib/`: Utilities and Constants (Status styles)
- `_types/`: Shared type definitions

---

## API Endpoints

### List Sales for Fulfillment
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `GET` | `/api/sales` | `app/api/sales/route.ts` |

*(Note: Fulfillment uses the shared Sales API but filters for specific statuses)*

**Query Parameters:**
- `status` (string): e.g. `AWAITING_DELIVERY`, `DELIVERED`
- `page`, `perPage` (number)
- `q` (string): Search query

**Required Permissions:** `menu.fulfillment` (VIEW_ALL/VIEW_DEPARTMENT/VIEW_OWN logic applies)

---

### Update Fulfillment Status / Allocation
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `PUT` | `/api/sales/[saleId]/fulfillment` | `app/api/sales/[saleId]/fulfillment/route.ts` |

**Required Permissions:** `fulfillment.manage`

---

## Database Schema

### Relevant Tables

*This feature mostly updates the `Sale` table and creates `InventoryTransaction` records.*

### Table: `Sale`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `String` | Primary Key |
| `status` | `SaleStatus` | Current status (e.g., AWAITING_DELIVERY) |
| `deliveryStatus` | `String` | Specific delivery tracking status |
| ... | ... | Other sale fields |

### Table: `InventoryTransaction`
| Column | Type | Description |
|--------|------|-------------|
| `id` | `String` | Primary Key |
| `type` | `TransactionType` | `SALE_OUT` |
| `quantity` | `Decimal` | Amount deducted |
| `lotId` | `String` | Specific Lot used |
| `saleItemId` | `String` | Link to Sale Item |
| ... | ... | ... |

---

## Validation Rules

### LotSelector Validation
- **Quantity Check**: Allocated quantity must not exceed:
  1. Required quantity for the Sale Item.
  2. Available balance in the selected Lot.
- **Expiry Check**: Warning if selected Lot is near expiry (logic in UI).
- **FIFO Suggestion**: UI suggests Lots based on First-In-First-Out logic.

---

## Key Components

### FulfillmentTable
Displays list of sales ready for fulfillment or in transit.
- **Features**: Status-based filtering, responsive mobile cards.
- **Props**: `FulfillmentTableProps`

### LotSelector
Interactive component for warehouse staff to select specific inventory Lots for each item in a Sale.
- **Features**: Auto-suggest, Validation, Manual override.
- **Props**: `LotSelectorProps`

---

## Component Props

### `FulfillmentTable`
(Uses type `FulfillmentTableProps`)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sales` | `SaleRecord[]` | ✅ | List of sales data |
| `total` | `number` | ✅ | Total count for pagination |
| `page` | `number` | ✅ | Current page |
| `perPage` | `number` | ✅ | Items per page |
| `loading` | `boolean` | ❌ | Loading state |
| `searchValue` | `string` | ❌ | Search term |
| `onSearchChange` | `(val: string) => void` | ❌ | Search handler |
| `dateRange` | `DateRange` | ❌ | Date filter |
| `onDateRangeChange` | `(range) => void` | ❌ | Date change handler |

### `LotSelector`
(Uses type `LotSelectorProps`)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
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

## Usage

```tsx
import { FulfillmentTable, LotSelector } from "@/features/fulfillment";

// List View
<FulfillmentTable
  sales={salesData}
  total={totalCount}
  page={currentPage}
  perPage={10}
  statusFilter="AWAITING_DELIVERY"
/>

// Detail View (in Modal or Page)
<LotSelector
  saleId={currentSaleId}
  onAllocationsChange={(allocs, valid) => setPayload(allocs)}
/>
```

