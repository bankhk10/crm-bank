# Notifications Module

This module handles the notification system, including creating notifications, reading/marking as read, rendering the bell icon with a dropdown list, and polling for updates.

The module follows the **Enterprise Module Layered Architecture**.

## Directory Structure

```text
modules/notifications/
├── infrastructure/           # Database operations (Prisma)
│   └── notification.repository.ts
├── application/              # Business logic / use cases
│   └── index.ts              (facade + inline thin use cases)
├── server/                   # Next.js Server Actions
│   └── actions.ts
├── features/                 # UI screens & hooks
│   └── bell/
│       ├── notification-bell.tsx
│       ├── notification-list.tsx
│       ├── notification-item.tsx
│       ├── use-notifications.ts
│       └── utils.ts
├── types/
│   └── index.ts
├── constants.ts              # Notification type UI config
├── index.ts                  # Barrel exports
└── README.md                 # This file
```

---

## Architecture Components

### 1. Infrastructure Layer (`infrastructure/`)

Contains all direct database interactions using Prisma.

- `notification.repository.ts`: CRUD operations for notifications (`createNotification`, `findNotifications`, `markAsRead`, `markAllAsRead`, `getUnreadCount`).

### 2. Application Layer (`application/`)

Contains business logic as use cases (thin wrappers in this module).

- `sendNotificationUseCase` — Public API used by other modules (e.g. sales) to create notifications.
- `getUserNotificationsUseCase` — Get notifications for a user.
- `markAsReadUseCase` / `markAllAsReadUseCase` — Mark notifications as read.
- `getUnreadCountUseCase` — Get unread count.

### 3. Server Layer (`server/`)

Next.js Server Actions that handle auth and call use cases.

- `getNotificationsAction` — Auth check → get notifications.
- `markAsReadAction` — Auth check → mark single read.
- `markAllAsReadAction` — Auth check → mark all read.
- `getUnreadCountAction` — Auth check → get count.

### 4. Features (`features/bell/`)

UI components for the notification bell popover.

- `NotificationBell` — Main entry point (popover with unread badge).
- `NotificationList` — Scrollable list inside the popover.
- `NotificationItem` — Individual notification card.
- `useNotifications` — Hook with polling (30s) and state management.
- `utils.ts` — Link resolution logic (e.g. redirect to approval page).

---

## Data Flow

1. **Client → Server Action**: UI components call functions from `server/actions.ts` via `useNotifications` hook.
2. **Server Action → Use Case**: Server Actions verify auth and delegate to Application Layer.
3. **Use Case → Repository**: Application Layer calls Infrastructure Layer for DB operations.
4. **Cross-module usage**: Other modules import `sendNotificationUseCase` from `@/modules/notifications` to create notifications.

---

## Usage

### NotificationBell (in Navbar)

```tsx
import { NotificationBell } from "@/modules/notifications";

<NotificationBell />;
```

### Sending notifications from other modules

```typescript
import { sendNotificationUseCase } from "@/modules/notifications/application";

await sendNotificationUseCase({
  userId: managerId,
  title: "รออนุมัติ",
  message: `รายการ ${saleNumber} ต้องการอนุมัติ`,
  type: "INFO",
  link: `/sales/${saleId}`,
});
```
