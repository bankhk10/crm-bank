# Fulfillment Feature

This module handles the fulfillment process, including order status management, picking/packing (LOT selection), and delivery tracking.

## Directory Structure

- `_components/`: UI components (FulfillmentTable, LotSelector, etc.)
- `_hooks/`: Custom hooks (useFulfillmentColumns)
- `_lib/`: Utilities and constants (STATUS_STYLE)
- `_types/`: Type definitions

## Key Components

### FulfillmentTable
Derived from `CustomTable` with added features:
- Responsive design (Cards on mobile, Table on desktop)
- Status filtering and color coding
- Date range filtering

### LotSelector
Component for allocating inventory lots to sale items.
- Suggests FIFO allocations
- Validates quantity
- Handles expiry dates

## Usage

```tsx
import { FulfillmentTable, LotSelector } from "@/features/fulfillment";

// List view
<FulfillmentTable sales={sales} ... />

// Detail view
<LotSelector saleId={id} ... />
```
