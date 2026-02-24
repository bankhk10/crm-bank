# Layout Module

This module handles the main application layout, including sidebar navigation, header, navbar, and the dashboard shell that wraps the main content area.

## Architecture

```
modules/layout/
 ┣ features/              ← UI screens (DashboardShell, Sidebar, Navbar)
 ┃ ┣ dashboard-shell.tsx
 ┃ ┣ navbar.tsx
 ┃ ┗ sidebar.tsx
 ┣ ui/                    ← Module-specific utilities & hooks
 ┃ ┣ navigation-utils.ts
 ┃ ┗ use-sidebar.ts
 ┣ types/
 ┃ ┗ index.ts
 ┣ constants.ts           ← Navigation items configuration
 ┣ index.ts               ← Barrel exports
 ┗ README.md
```

### Layer Responsibilities

| Layer          | Responsibility                                         |
| -------------- | ------------------------------------------------------ |
| `features/`    | UI screen components (DashboardShell, Sidebar, Navbar) |
| `ui/`          | Module-specific hooks and navigation utility functions |
| `types/`       | TypeScript type definitions                            |
| `constants.ts` | Navigation items configuration data                    |

> **Note**: This module is UI-only — no `infrastructure/`, `application/`,
> or `server/` layers are needed since there are no database operations,
> business logic, or server actions.

## Usage

### Components

```tsx
import { DashboardShell, Sidebar, Navbar } from "@/modules/layout";

// Main layout wrapper
<DashboardShell
  roles={roles}
  permissionKeys={permissionKeys}
  displayName={user.name}
>
  {children}
</DashboardShell>;
```

### Hooks

```tsx
import { useSidebar } from "@/modules/layout";

const { isOpen, open, close, toggle } = useSidebar();
```

### Types

```tsx
import type {
  SidebarProps,
  SidebarNavItem,
  DashboardShellProps,
} from "@/modules/layout";
```

### Navigation Items

```tsx
import { navigationItems } from "@/modules/layout";

// Access sidebar navigation configuration
navigationItems.forEach((item) => console.log(item.label));
```

## Components

### DashboardShell

Main layout wrapper that includes:

- Desktop sidebar (visible on md+ screens)
- Mobile sidebar with overlay (visible on mobile)
- Navbar with user info
- Main content area with rounded corners

### Sidebar

Navigation sidebar with:

- Logo and branding
- Permission-based navigation filtering
- Collapsible menu items with children
- Active route highlighting

### Navbar

Top navigation bar with:

- Mobile menu toggle
- Notification bell
- User info display
- Logout button

## Dependencies

- `@/components/ui`: UI primitives (Button, Divider).
- `@/src/core/rbac`: RBAC utilities.
- `next/navigation`: Next.js navigation.
- `next-auth/react`: Authentication.
- `@/modules/notifications`: NotificationBell (dynamic import).
