# Customers Feature

This module handles all customer-related functionalities, including management of different customer types (Dealer, Sub-dealer, Farmer, Broker), their details, orders, and hierarchies.

## Directory Structure

- `_components/`: UI components (Table, Forms, Badges, Detail Panels).
  - `forms/`: Form components for each customer type.
- `_hooks/`: Custom hooks (e.g., table columns configuration).
- `_lib/`: Constants, utilities, and helper functions.
- `_types/`: TypeScript definitions specific to customers.

## Usage

### Components

```tsx
import { CustomersTable, CustomerFormDealer } from "@/features/customers";

// Use directly in pages
<CustomersTable data={...} ... />
<CustomerFormDealer onSubmit={...} ... />
```

### Types

```tsx
import { CustomerRecord, CustomerPayload } from "@/features/customers";
```

## Routes

- `/customers`: Main list view.
- `/customers/new`: Create new customer (with type selection).
- `/customers/[id]`: View customer details.
- `/customers/[id]/edit`: Edit customer.

## Permissions

- `customer.view`: View list and details.
- `customer.create`: Create new customers.
- `customer.edit`: Edit existing customers.
- `customer.delete`: Delete customers.
- `customer.dealer`: Manage Dealers.
- `customer.subdealer`: Manage Sub-dealers.
- `customer.farmer`: Manage Farmers.
- `customer.broker`: Manage Brokers.

## Dependencies

- `@/components/ui`: UI primitives.
- `@/components/custom`: Custom shared components (Table, DatePicker, etc.).
- `@/hooks`: Shared hooks (use-file-upload, etc.).
