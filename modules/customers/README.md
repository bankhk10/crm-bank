# Customers Module

This module handles all customer-related functionalities, including management of different customer types (Dealer, Sub-dealer, Farmer, Broker), their details, orders, and hierarchies.

The module follows the **Enterprise Module Layered Architecture**.

## Directory Structure

```text
modules/customers/
├── infrastructure/     # Database operations and queries
│   └── customer.repository.ts
├── application/        # Business logic and DTOs
│   ├── validations.ts
│   ├── create-customer.ts
│   ├── update-customer.ts
│   ├── generate-customer-code.ts
│   ├── customer-mapper.ts
│   └── index.ts
├── server/             # Next.js Server Actions and Revalidation
│   └── actions.ts
├── features/           # Feature-specific React Components
│   ├── list-view/
│   ├── detail-view/
│   └── form/           # Centralized Customer Form and sections
├── ui/                 # Reusable UI components specific to customer module
├── types/              # TypeScript types and interfaces
├── constants.ts        # Module constants
├── index.ts            # Public API (Barrel file)
└── README.md           # This file
```

---

## Architecture Components

### 1. Infrastructure Layer (`infrastructure/`)

Contains all direct database interactions using Prisma.

- `customer.repository.ts`: Handles CRUD, complex queries, filtering, and database transactions for customers.

### 2. Application Layer (`application/`)

Contains the core business logic, validations, and mapping.

- **Validations (`validations.ts`)**: Zod schemas for input validation.
- **Use Cases (`create-customer.ts`, `update-customer.ts`)**: Pure functions implementing business rules and orchestrating repository calls.
- **Customer Code Generation (`generate-customer-code.ts`)**: Generates custom running numbers based on the customer type (e.g. F69120001).
- **Mapper (`customer-mapper.ts`)**: Standardizes the mapping from the UI Form Payload format to the Application Layer input.
- **DTO Mapping**: Mapping database models to UI-friendly DTOs.

### 3. Server Layer (`server/`)

Next.js specific boundary for Server Actions.

- **Actions (`actions.ts`)**: Server Actions designed to be called from Client Components. They handle Authentication, RBAC checks, calling Application Layer Use Cases, and Next.js revalidation (`revalidatePath`).

### 4. Features & UI

React components organized by feature and generic use.

- **`features/`**: Complex business components (e.g. `CustomersTable`, Forms).
- **`ui/`**: Simple reusable visual components like `CustomerStatusBadge`.

---

## Feature Details

### Customer Form

The Customer Form architecture in `features/form/` has been highly centralized to reduce duplication and improve scalability:

- **`CustomerForm.tsx`**: The main container component. It sets up `react-hook-form`, `zodResolver`, and `FormProvider` to manage all state centrally.
- **`sections/`**: Reusable generic blocks (e.g. `BasicInfoSection`, `ContactInfoSection`, `AddressSection`, `ImageGallerySection`) that extract state via `useFormContext()`.
- **`specific/`**: Fields specific to a customer type (e.g. `DealerFields`, `FarmerFields`) rendered dynamically through a router (`SpecificSection`).
- **`config/`**: Contains static configurations and default values.

This structure allows the system to easily support new customer types by just adding a new `*Fields.tsx` component and configuring it in the `SpecificSection` router without affecting the rest of the form.

---

## Data Flow / Guidelines

1. **Client -> Server Action**: Client components MUST call functions from `server/actions.ts`. They should NOT call the Application Layer directly.
2. **Server Action -> Use Case**: Server Actions verify permissions and pass execution to Use Cases in the Application Layer.
3. **Use Case -> Repository**: The Application Layer contains the business logic, validates inputs, and queries/mutates data via the Infrastructure Layer.
4. **DTOs**: Replying back from Server Actions, always use clean DTOs (e.g. `CustomerRecord`, `CustomerDetail`) and avoid returning raw Prisma models.
