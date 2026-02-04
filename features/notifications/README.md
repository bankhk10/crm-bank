# Notifications Feature

This feature module manages the notification system, including the bell icon, dropdown list, and polling mechanism.

## Directory Structure

- `_components/`: UI components (NotificationBell, NotificationList, NotificationItem).
- `_hooks/`: Custom state logic (useNotifications).
- `_lib/`: Notification configuration and utilities.
- `_types/`: Shared type definitions.

## Key Components

### NotificationBell
The main trigger component. Uses `Popover` to show notifications. It handles the "unread" badge.

### NotificationList / NotificationItem
Displays the list of notifications with specific styling based on notification type (SUCCESS, ERROR, etc.).
Handles navigation and marking as read.

## Usage

```tsx
import { NotificationBell } from "@/features/notifications";

// In Navbar or Header
<NotificationBell />
```

## Internal Logic
- **Polling**: Fetches `/api/notifications` every 30 seconds.
- **Mark as Read**: calls `/api/notifications/:id/read`.
- **Navigation**: Intelligent navigation (e.g., approval requests go to approval page).
