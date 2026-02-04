# Credit Limits Feature

This feature module manages customer credit limits, including displaying credit status, temporary limits, and editing limits.

## Directory Structure

- `_components/`: UI components (CreditLimitTable, CreditLimitForm, Cards, etc.)
- `_hooks/`: Custom hooks (useCreditLimitColumns)
- `_lib/`: Utilities for credit calculations
- `_types/`: Shared type definitions

## Key Components

### CreditLimitTable
Displays list of customers with their credit info.
- **Desktop**: Table view via `CustomTable`.
- **Mobile**: Card view via `CreditLimitCards`.
- **Toolbar**: Search by name or code.

### CreditLimitForm
Form for creating or editing credit limits (regular and promo amounts).
NOTE: Temporary credit limits are typically handled separately or require specific logic not fully covered in this basic form.

## Usage

```tsx
import { CreditLimitTable } from "@/features/credit-limits";

<CreditLimitTable
  data={customers}
  loading={loading}
  // ...props
/>
```
