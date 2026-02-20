# Layout Feature

This module handles the main application layout, including sidebar navigation, header, navbar, and the dashboard shell that wraps the main content area.

## Directory Structure

- `_components/`: UI components (DashboardShell, Sidebar, Navbar).
- `_hooks/`: Custom hooks (sidebar state management).
- `_lib/`: Navigation utilities (filtering, route matching).
- `_types/`: TypeScript definitions for layout components.

## Usage

### Components

```tsx
import { DashboardShell, Sidebar, Navbar } from "@/features/layout";

// Main layout wrapper
<DashboardShell 
  roles={roles} 
  permissionKeys={permissionKeys}
  displayName={user.name}
>
  {children}
</DashboardShell>
```

### Hooks

```tsx
import { useSidebar } from "@/features/layout";

const { isOpen, open, close, toggle } = useSidebar();
```

### Types

```tsx
import { 
  SidebarProps, 
  SidebarNavItem, 
  DashboardShellProps 
} from "@/features/layout";
```

### Navigation Items

```tsx
import { navigationItems } from "@/features/layout";

// Access sidebar navigation configuration
navigationItems.forEach(item => console.log(item.label));
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
