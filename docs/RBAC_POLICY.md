# RBAC Policy - CRM System

> **Version**: 1.0.0 | **Updated**: 2026-01-28  
> **Related**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [DATA_MODEL.md](./DATA_MODEL.md)

---

## 1. RBAC Overview

```
User ─────N:N─────▶ Role ─────N:N─────▶ Permission
  │                                        ▲
  │                                        │
  └──────N:N───────────────────────────────┘
         (UserPermissionOverride - allows deny/override)
```

---

## 2. System Roles

| Role | Slug | Description | Is System |
|------|------|-------------|-----------|
| Admin | `admin` | Full system access | Yes |
| Manager | `manager` | Department management | Yes |
| Sales | `sales` | Sales operations | Yes |
| Viewer | `viewer` | Read-only access | Yes |

### Role Hierarchy
```
admin > manager > sales > viewer
```

---

## 3. Permission Types

### 3.1 Categories
```prisma
enum PermissionType {
  MENU    // Access to menu/page
  ACTION  // Perform specific action
  DATA    // Data access level
}
```

### 3.2 Naming Convention
```
{resource}.{action}

Examples:
- customer.read
- customer.create
- customer.update
- customer.delete
- sale.approve
- sale.reject
- report.export
```

### 3.3 Resources
| Resource | Actions |
|----------|---------|
| customer | read, create, update, delete |
| product | read, create, update, delete |
| sale | read, create, update, delete, approve, reject |
| employee | read, create, update, delete |
| credit | read, create, update, approve |
| report | read, export |
| role | read, create, update, delete |
| permission | read, assign |

---

## 4. Data Access Levels

### 4.1 View Access
```prisma
enum DataAccessLevel {
  VIEW_OWN         // See only own records
  VIEW_DEPARTMENT  // See department records
  VIEW_ALL         // See all records
}
```

### 4.2 Edit Access
```prisma
enum EditAccessLevel {
  EDIT_NONE        // Cannot edit
  EDIT_OWN         // Edit only own records
  EDIT_DEPARTMENT  // Edit department records
  EDIT_ALL         // Edit all records
}
```

### 4.3 Delete Access
```prisma
enum DeleteAccessLevel {
  DELETE_NONE        // Cannot delete
  DELETE_OWN         // Delete only own records
  DELETE_DEPARTMENT  // Delete department records
  DELETE_ALL         // Delete all records
}
```

---

## 5. Role-Permission Matrix

### Admin
| Permission | View | Edit | Delete |
|------------|------|------|--------|
| customer.* | ALL | ALL | ALL |
| product.* | ALL | ALL | ALL |
| sale.* | ALL | ALL | ALL |
| employee.* | ALL | ALL | ALL |
| role.* | ALL | ALL | ALL |

### Manager
| Permission | View | Edit | Delete |
|------------|------|------|--------|
| customer.* | DEPARTMENT | DEPARTMENT | DEPARTMENT |
| product.* | ALL | NONE | NONE |
| sale.* | DEPARTMENT | DEPARTMENT | NONE |
| sale.approve | Yes | - | - |
| employee.* | DEPARTMENT | DEPARTMENT | NONE |
| role.* | - | - | - |

### Sales
| Permission | View | Edit | Delete |
|------------|------|------|--------|
| customer.* | OWN | OWN | NONE |
| product.* | ALL | NONE | NONE |
| sale.* | OWN | OWN | NONE |
| sale.approve | - | - | - |
| employee.* | OWN | OWN | NONE |

### Viewer
| Permission | View | Edit | Delete |
|------------|------|------|--------|
| customer.read | ALL | - | - |
| product.read | ALL | - | - |
| sale.read | ALL | - | - |

---

## 6. Permission Override

### User-Level Override
```prisma
model UserPermissionOverride {
  userId       String
  permissionId String
  allow        Boolean           // true = grant, false = deny
  dataAccess   DataAccessLevel?
  editAccess   EditAccessLevel?
  deleteAccess DeleteAccessLevel?
  reason       String?
}
```

### Override Rules
1. Override takes precedence over role permissions
2. Deny (`allow: false`) always wins
3. Must document reason for audit

### Example
```typescript
// User has 'sales' role with VIEW_OWN
// Override grants VIEW_ALL for specific user
{
  userId: "user123",
  permissionId: "customer.read",
  allow: true,
  dataAccess: "VIEW_ALL",
  reason: "Regional supervisor - needs cross-department visibility"
}
```

---

## 7. Permission Check Flow

```
1. Get user's roles → RolePermission[]
2. Get user's overrides → UserPermissionOverride[]
3. Check permission key
4. If override exists:
   - If allow=false → DENY
   - If allow=true → Use override's access levels
5. If no override:
   - Use role's access levels
   - Multiple roles → take highest level
6. Apply data filter based on access level
```

### Code Implementation
```typescript
// lib/rbac.ts
async function hasPermission(
  userId: string, 
  permissionKey: string
): Promise<boolean> {
  // Check override first
  const override = await getOverride(userId, permissionKey);
  if (override) return override.allow;
  
  // Check role permissions
  const roles = await getUserRoles(userId);
  for (const role of roles) {
    if (roleHasPermission(role, permissionKey)) {
      return true;
    }
  }
  
  return false;
}

async function getDataFilter(
  userId: string,
  permissionKey: string
): Promise<PrismaFilter> {
  const access = await getDataAccessLevel(userId, permissionKey);
  
  switch (access) {
    case 'VIEW_ALL':
      return {}; // No filter
    case 'VIEW_DEPARTMENT':
      return { departmentId: user.departmentId };
    case 'VIEW_OWN':
      return { createdById: userId };
    default:
      return { id: 'impossible' }; // Block all
  }
}
```

---

## 8. API Guard Pattern

```typescript
// app/api/customers/route.ts
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check permission
  const canRead = await hasPermission(session.user.id, 'customer.read');
  if (!canRead) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Apply data filter
  const filter = await getDataFilter(session.user.id, 'customer.read');
  
  const customers = await prisma.customer.findMany({
    where: {
      ...filter,
      deletedAt: null
    }
  });
  
  return NextResponse.json({ data: customers });
}
```

---

## 9. Special Permissions

### Sale Approval
- Only users with `sale.approve` can approve/reject sales
- Typically: Manager, Admin

### Credit Approval
- Only `credit.approve` can approve temporary credit
- Requires Manager or Admin role

### Admin-Only Actions
- Role management (`role.*`)
- Permission assignment (`permission.assign`)
- System settings

---

## 10. Audit Trail

All permission changes are logged:
```typescript
// When permission is granted/revoked
await auditLog.create({
  action: 'PERMISSION_CHANGE',
  entityType: 'UserPermissionOverride',
  userId: currentUser.id,
  oldValue: { allow: true },
  newValue: { allow: false },
  reason: 'User suspended'
});
```

---

**See Also**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [API_CONTRACTS.md](./API_CONTRACTS.md)
