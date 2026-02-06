# Notifications Feature

This feature module manages the notification system, including the bell icon, dropdown list, polling mechanism, and real-time updates for user alerts.

## Directory Structure

- `_components/`: UI components (NotificationBell, NotificationList, NotificationItem).
- `_hooks/`: Custom state logic (useNotifications).
- `_lib/`: Notification configuration and utilities.
- `_types/`: Shared type definitions.

---

## API Endpoints

### List Notifications
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `GET` | `/api/notifications` | `app/api/notifications/route.ts` |

**Description:** Fetches the latest notifications for the current authenticated user.

**Required Permissions:** User must be authenticated (`session.user.id`).

---

### Mark All as Read
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `POST` | `/api/notifications/read-all` | `app/api/notifications/read-all/route.ts` |

**Description:** Marks all notifications for the current user as read.

**Required Permissions:** User must be authenticated.

---

### Mark Single as Read
| Method | Endpoint | File Location |
|--------|----------|---------------|
| `POST` | `/api/notifications/[id]/read` | `app/api/notifications/[id]/read/route.ts` |

**Description:** Marks a specific notification as read.

**Required Permissions:** User must be authenticated.

---

## Database Schema

### Table: `Notification`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `String` | Primary Key (cuid) |
| `userId` | `String` | Foreign Key to User |
| `title` | `String` | หัวข้อการแจ้งเตือน |
| `message` | `String` | เนื้อหา |
| `type` | `String` | ประเภท (INFO, SUCCESS, WARNING, ERROR) |
| `link` | `String?` | ลิงก์ที่เกี่ยวข้อง (เช่น ไปยังหน้ารายละเอียด) |
| `isRead` | `Boolean` | สถานะการอ่าน (default: false) |
| `createdAt` | `DateTime` | เวลาที่สร้าง |
| `updatedAt` | `DateTime` | เวลาแก้ไขล่าสุด |

### Relationships
```
Notification
└── user: User (Many-to-One)
    └── Notification.userId → User.id
```

---

## Validation Rules

### Authorization
- All endpoints require a valid user session (`auth()`).
- Users can only access/modify their own notifications (`userId` match).

---

## Key Components

### NotificationBell
The main entry point component.
- **Features**: Polling every 30s, Unread badge count, Popover display.
- **Usage**: Placed in top navigation bar.

### NotificationList
Renders the list of notifications inside the Bell popover.
- **Features**: Groups by date (Today, Yesterday), Handles empty states.

---

## Component Props

### `NotificationBell`
*No props (Self-contained logic via `useNotifications` hook).*

### `NotificationList`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `notifications` | `Notification[]` | ✅ | List of notification objects |
| `onRead` | `(id: string) => void` | ✅ | Callback when marking a single item as read |
| `onAction` | `() => void` | ✅ | Callback when an item is clicked/interacting (e.g. close popover) |

---

## Types

### `Notification`
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
```

## Usage

```tsx
import { NotificationBell } from "@/features/notifications";

// In Navbar or Header
<NotificationBell />
```
