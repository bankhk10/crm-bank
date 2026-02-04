# Companies Feature

This feature module manages company/customer data, including listing, creating, editing, and deleting companies.

## Directory Structure

- `_components/`: UI components (CompaniesTable, CompanyForm, etc.)
- `_hooks/`: Custom hooks (useCompanyColumns)
- `_lib/`: Utilities and constants
- `_types/`: Shared type definitions

## Key Components

### CompaniesTable
Derived from `CustomTable`. Handles responsive views:
- **Desktop**: Data table with sorting and actions.
- **Mobile**: `CompaniesCards` view.
- **Toolbar**: `CompaniesToolbar` with search and date filters.

### CompanyForm
Form for creating and editing companies. Handles validation and API submission.
Includes "Random Fill" for development testing.

### CompaniesKanbanBoard
A Kanban-style view for companies (usage depends on requirements).

## Usage

```tsx
import { CompaniesTable, CompanyForm } from "@/features/companies";

// List View
<CompaniesTable
  data={companies}
  loading={loading}
  // ...props
/>

// Form
<CompanyForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```
