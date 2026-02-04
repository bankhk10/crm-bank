# Temporary Credit Limits Feature

This feature module manages temporary credit limit requests.

## Directory Structure

- `_components/`: UI components (Table, Form, Cards, Toolbar, etc.)
- `_hooks/`: Custom hooks (useTemporaryCreditLimitColumns)
- `_lib/`: Constants (Status Styles)
- `_types/`: Shared type definitions

## Key Components

### TemporaryCreditLimitTable
Displays list of requests.
- **Desktop**: Table view.
- **Mobile**: Card view.
- **Toolbar**: Search by customer/code, date range.

### TemporaryCreditLimitForm
Form for creating or editing requests.
- Validates expiration date.
- Select customer (dealer).

## Usage

```tsx
import { TemporaryCreditLimitTable } from "@/features/temporary-credit-limits";

<TemporaryCreditLimitTable
  data={data}
  loading={loading}
  // ...props
/>
```
