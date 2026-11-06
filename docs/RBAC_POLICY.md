# RBAC Policy - CRM System

> **Version**: 2.0.0  
> **Updated**: 2026-08-28  
> **Source of Truth**: `prisma/seed/rbac.ts`  
> **Related**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [DATA_MODEL.md](./DATA_MODEL.md) | [ARCHITECTURE.md](./ARCHITECTURE.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md) | [MODULE_ARCHITECTURE.md](./MODULE_ARCHITECTURE.md)

---

## 1. RBAC Overview

The system uses Role-Based Access Control (RBAC) with:

- Roles
- Permissions
- User-level permission overrides
- Data access scope
- Edit access scope
- Delete access scope

High-level relationship:

```text
User
  │
  ├──── N:N ────> Role ──── N:N ────> Permission
  │
  └──── N:N ────> UserPermissionOverride
                     │
                     └── grant / deny / scope override
```

The actual roles and permissions are defined by the current RBAC seed:

```text
prisma/seed/rbac.ts
```

---

# 2. System Roles

| Role             | Slug             | Description                                         | Is System |
| ---------------- | ---------------- | --------------------------------------------------- | --------- |
| Administrator    | `administrator`  | Full system access (RBAC included)                  | Yes       |
| Admin            | `admin`          | High-level access (excludes RBAC)                   | Yes       |
| ผู้บริหาร        | `ceo`            | ผู้บริหารสูงสุด - สิทธิ์ดูข้อมูลทั้งหมด (Read-only) | Yes       |
| ผู้จัดการฝ่ายขาย | `sales_manager`  | Department management + approval                    | No        |
| ธุรการขาย        | `sales_admin`    | จัดการการจัดส่งสินค้าและงานเอกสารฝ่ายขาย            | No        |
| พนักงานฝ่ายขาย   | `sales_employee` | Basic sales operations                              | No        |

### Role Hierarchy

```text
Administrator > Admin > CEO (read-only) > sales_manager > sales_admin > sales_employee
```

> Role hierarchy เป็นแนวคิดเชิงสิทธิ์ของระบบ การตรวจสอบสิทธิ์จริงต้องใช้ Permission และ Access Scope ที่กำหนดไว้ ไม่ควรสมมติว่าระดับ Role เพียงอย่างเดียวให้สิทธิ์ทุกอย่าง

---

# 3. Permission Categories

```prisma
enum PermissionType {
  MENU    // Access to menu/page navigation
  ACTION  // Perform specific CRUD/business action
  DATA    // Data access scope
}
```

### MENU

ใช้ควบคุมการเข้าถึงเมนูหรือหน้าหลัก

### ACTION

ใช้ควบคุมการกระทำ เช่น create, edit, delete, approve, export

### DATA

ใช้กำหนดขอบเขตข้อมูล เช่น OWN, TEAM, DEPARTMENT, ALL

---

# 4. Permission List

## 4.1 MENU Permissions

| Key                            | Name (TH)                  | Menu Path                  |
| ------------------------------ | -------------------------- | -------------------------- |
| `menu.dashboard.admin`         | เมนูแดชบอร์ดผู้บริหาร      | `/dashboard/admin`         |
| `menu.dashboard.manager`       | เมนูแดชบอร์ดผู้จัดการ      | `/dashboard/manager`       |
| `menu.reports`                 | เมนูรายงาน                 | `/reports`                 |
| `menu.sales`                   | เมนูการขาย                 | `/sales`                   |
| `menu.products`                | เมนูสินค้า                 | `/products`                |
| `menu.customers`               | เมนูลูกค้า                 | `/customers`               |
| `menu.employees`               | เมนูพนักงาน                | `/employee`                |
| `menu.companies`               | เมนูบริษัท                 | `/companies`               |
| `menu.credit_limits`           | เมนูวงเงินเครดิต           | `/credit-limits`           |
| `menu.temporary_credit_limits` | เมนูวงเงินสินเชื่อชั่วคราว | `/temporary-credit-limits` |
| `menu.fulfillment`             | เมนูจัดส่งสินค้า           | `/fulfillment`             |
| `menu.sales_forecast`          | เมนูคาดการณ์ยอดขาย         | `/sales-forecast`          |
| `menu.sales_targets`           | เมนูตั้งเป้าหมายยอดขาย     | `/sales-targets`           |
| `menu.rbac`                    | เมนูจัดการสิทธิ์           | `/rbac`                    |
| `menu.admin`                   | เมนูตั้งค่าระบบ            | `/admin`                   |

---

## 4.2 Report Permissions

| Key                          | Name (TH)            | Menu Path                      |
| ---------------------------- | -------------------- | ------------------------------ |
| `report.time_sales`          | รายงานยอดขายตามเวลา  | `/reports/time-sales`          |
| `report.product_sales`       | รายงานตามสินค้า      | `/reports/product-sales`       |
| `report.product_group_sales` | รายงานตามกลุ่มสินค้า | `/reports/product-group-sales` |
| `report.customer_sales`      | รายงานตามลูกค้า      | `/reports/customer-sales`      |
| `report.salesperson`         | รายงานตามพนักงานขาย  | `/reports/salesperson`         |
| `report.export`              | ส่งออกรายงาน         | `-`                            |

---

## 4.3 Sale Permissions

| Key                    | Name (TH)         | Action          |
| ---------------------- | ----------------- | --------------- |
| `sale.create`          | สร้างใบขาย        | create          |
| `sale.edit`            | แก้ไขใบขาย        | edit            |
| `sale.view`            | ดูรายละเอียดใบขาย | view            |
| `sale.delete`          | ลบใบขาย           | delete          |
| `sale.approve`         | อนุมัติใบขาย      | approve         |
| `sale.confirm-payment` | ยืนยันการชำระเงิน | confirm_payment |

---

## 4.4 Product Permissions

| Key              | Name (TH)                             | Action |
| ---------------- | ------------------------------------- | ------ |
| `product.create` | สร้างสินค้า                           | create |
| `product.edit`   | แก้ไขสินค้า                           | edit   |
| `product.delete` | ลบสินค้า                              | delete |
| `product.view`   | ดูรายละเอียดสินค้า                    | view   |
| `product.manage` | จัดการสินค้า (ราคา, สต็อก, โปรโมชั่น) | manage |
| `product.export` | ส่งออกสินค้า                          | export |

---

## 4.5 Customer Permissions

| Key                         | Name (TH)                           | Action |
| --------------------------- | ----------------------------------- | ------ |
| `customer.create.dealer`    | สร้างลูกค้าตัวแทนจำหน่าย            | create |
| `customer.create.subdealer` | สร้างลูกค้าตัวแทนจำหน่ายย่อย        | create |
| `customer.create.farmer`    | สร้างลูกค้าเกษตรกร                  | create |
| `customer.create.broker`    | สร้างลูกค้านายหน้า                  | create |
| `customer.edit.dealer`      | แก้ไขลูกค้าตัวแทนจำหน่าย            | edit   |
| `customer.edit.subdealer`   | แก้ไขลูกค้าตัวแทนจำหน่ายย่อย        | edit   |
| `customer.edit.farmer`      | แก้ไขลูกค้าเกษตรกร                  | edit   |
| `customer.edit.broker`      | แก้ไขลูกค้านายหน้า                  | edit   |
| `customer.delete.dealer`    | ลบลูกค้าตัวแทนจำหน่าย               | delete |
| `customer.delete.subdealer` | ลบลูกค้าตัวแทนจำหน่ายย่อย           | delete |
| `customer.delete.farmer`    | ลบลูกค้าเกษตรกร                     | delete |
| `customer.delete.broker`    | ลบลูกค้านายหน้า                     | delete |
| `customer.view.dealer`      | ดูรายละเอียดลูกค้าตัวแทนจำหน่าย     | view   |
| `customer.view.subdealer`   | ดูรายละเอียดลูกค้าตัวแทนจำหน่ายย่อย | view   |
| `customer.view.farmer`      | ดูรายละเอียดลูกค้าเกษตรกร           | view   |
| `customer.view.broker`      | ดูรายละเอียดลูกค้านายหน้า           | view   |
| `customer.export`           | ส่งออกข้อมูลลูกค้า                  | export |

---

## 4.6 Credit Limit Permissions

| Key                | Name (TH)           | Action |
| ------------------ | ------------------- | ------ |
| `creditlimit.edit` | แก้ไขวงเงินสินเชื่อ | edit   |

---

## 4.7 Temporary Credit Limit Permissions

| Key                             | Name (TH)                          | Action  |
| ------------------------------- | ---------------------------------- | ------- |
| `temporary_creditlimit.create`  | สร้างวงเงินสินเชื่อชั่วคราว        | create  |
| `temporary_creditlimit.edit`    | แก้ไขวงเงินสินเชื่อชั่วคราว        | edit    |
| `temporary_creditlimit.delete`  | ลบวงเงินสินเชื่อชั่วคราว           | delete  |
| `temporary_creditlimit.view`    | ดูรายละเอียดวงเงินสินเชื่อชั่วคราว | view    |
| `temporary_creditlimit.approve` | อนุมัติวงเงินสินเชื่อชั่วคราว      | approve |

---

## 4.8 Employee Permissions

| Key               | Name (TH)           | Action | หมายเหตุ                |
| ----------------- | ------------------- | ------ | ----------------------- |
| `employee.view`   | ดูรายละเอียดพนักงาน | view   |                         |
| `employee.create` | สร้างพนักงาน        | create |                         |
| `employee.edit`   | แก้ไขพนักงาน        | edit   | สิทธิ์แก้ไขพนักงานเฉพาะ |
| `employee.delete` | ลบพนักงาน           | delete |                         |

---

## 4.9 Company Permissions

| Key              | Name (TH)          | Action |
| ---------------- | ------------------ | ------ |
| `company.create` | สร้างบริษัท        | create |
| `company.edit`   | แก้ไขบริษัท        | edit   |
| `company.delete` | ลบบริษัท           | delete |
| `company.view`   | ดูรายละเอียดบริษัท | view   |

---

## 4.10 RBAC Management Permissions

| Key                      | Name (TH)             | Action   |
| ------------------------ | --------------------- | -------- |
| `rbac.manage`            | จัดการสิทธิ์ผู้ใช้    | manage   |
| `rbac.role.create`       | สร้าง Role            | create   |
| `rbac.role.edit`         | แก้ไข Role            | edit     |
| `rbac.role.delete`       | ลบ Role               | delete   |
| `rbac.permission.assign` | กำหนด Permission      | assign   |
| `rbac.user.override`     | Override สิทธิ์ผู้ใช้ | override |

---

## 4.11 Sales Target Permissions

| Key                   | Name (TH)           | Action |
| --------------------- | ------------------- | ------ |
| `sales_target.view`   | ดูเป้าหมายยอดขาย    | view   |
| `sales_target.create` | สร้างเป้าหมายยอดขาย | create |
| `sales_target.edit`   | แก้ไขเป้าหมายยอดขาย | edit   |
| `sales_target.delete` | ลบเป้าหมายยอดขาย    | delete |

---

## 4.12 System Permissions

| Key                   | Name (TH)       | Action |
| --------------------- | --------------- | ------ |
| `system.audit_log`    | ดู Audit Log    | view   |
| `system.security_log` | ดู Security Log | view   |
| `system.settings`     | ตั้งค่าระบบ     | manage |

---

## 4.13 DATA Permissions

| Key                           | Name (TH)                  | Resource              |
| ----------------------------- | -------------------------- | --------------------- |
| `data.sales`                  | ขอบเขตข้อมูลการขาย         | sale                  |
| `data.products`               | ขอบเขตข้อมูลสินค้า         | product               |
| `data.customers`              | ขอบเขตข้อมูลลูกค้า         | customer              |
| `data.employees`              | ขอบเขตข้อมูลพนักงาน        | employee              |
| `data.creditlimits`           | ขอบเขตข้อมูลวงเงินสินเชื่อ | creditlimit           |
| `data.temporary_creditlimits` | ขอบเขตข้อมูลวงเงินชั่วคราว | temporary_creditlimit |

---

# 5. Access Levels

## 5.1 View Access

```typescript
enum DataAccessLevel {
  VIEW_OWN
  VIEW_TEAM
  VIEW_DEPARTMENT
  VIEW_ALL
}
```

## 5.2 Edit Access

```typescript
enum EditAccessLevel {
  EDIT_NONE
  EDIT_OWN
  EDIT_DEPARTMENT
  EDIT_ALL
}
```

## 5.3 Delete Access

```typescript
enum DeleteAccessLevel {
  DELETE_NONE
  DELETE_OWN
  DELETE_DEPARTMENT
  DELETE_ALL
}
```

> ใช้ค่าที่ตรงกับ `prisma/schema.prisma` และ RBAC seed ปัจจุบันเสมอ

---

# 6. Role-Permission Matrix

## Administrator

```text
- All MENU permissions
- All ACTION permissions
- VIEW_ALL
- EDIT_ALL
- DELETE_ALL
- RBAC management
```

## Admin

```text
- High-level application access
- No RBAC management
- Broad data access
- CRUD/business permissions ตาม seed configuration
```

รายละเอียดที่แท้จริงของ Role ให้ยึด `prisma/seed/rbac.ts`

## CEO

```text
- Read-only executive access
- VIEW_ALL
- No create/edit/delete/approve actions
- Audit/security log access ตาม configuration
```

## Sales Manager

```text
- Sales management
- Approval
- Customer management
- Credit management
- Employee visibility by department
- Data access according to configured scope
```

## Sales Admin

```text
- Sales view/fulfillment operations
- Customer/Product view
- Stock view
- Broad read accessตาม configuration
```

## Sales Employee

```text
- Sales create/edit/view/delete
- Product view
- Customer operations ตาม Customer Type
- Temporary credit operations
- Employee read access
- Data access according to configured scope
```

> Role-to-permission assignments และรายละเอียด Access Scope ต้องอ้างอิงจาก `prisma/seed/rbac.ts` เป็นหลัก ไม่ควร hard-code ความเข้าใจจากเอกสารนี้ใน Code

---

# 7. User Permission Override

Users can receive an explicit permission override.

Example:

```prisma
model UserPermissionOverride {
  userId       String
  permissionId String
  allow        Boolean
  dataAccess   DataAccessLevel?
  editAccess   EditAccessLevel?
  deleteAccess DeleteAccessLevel?
  reason       String?
}
```

Meaning:

```text
allow = true
    → Explicit grant

allow = false
    → Explicit deny
```

---

# 8. Override Priority

Current priority:

```text
1. UserPermissionOverride
2. RolePermission
3. Default Deny
```

Explicit deny must be respected according to the project's RBAC implementation.

The exact resolution behavior should be verified in the current RBAC implementation and seed configuration.

---

# 9. Session Permission Storage

The application uses compact permission storage in the session/JWT.

Current shape:

```typescript
interface SessionUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissionKeys: string[];
  departmentId?: string | null;
  positionId?: string | null;
  dataAccessByResource: Record<string, DataAccessLevel>;
  editAccessByResource: Record<string, EditAccessLevel>;
  deleteAccessByResource: Record<string, DeleteAccessLevel>;
  employeeId?: string | null;
}
```

Permission checks should use:

```typescript
session.user.permissionKeys?.includes("sale.create");
```

Do not reintroduce full permission objects into the session without an explicit architectural decision.

---

# 10. Permission Check Flow

## Client-Side

Client-side permission checks are for UI behavior such as:

- Showing/hiding actions
- Disabling buttons
- Preventing unnecessary UI interaction

Example:

```typescript
const { hasPermission, canView, canEdit, canDelete } = usePermission();

if (hasPermission("sale.create")) {
  // Show create action
}
```

Client-side checks are NOT the security boundary.

---

## Server-Side

The server must enforce permissions.

Typical flow:

```text
Request
  ↓
Authentication
  ↓
Permission
  ↓
Data Access Scope
  ↓
Application Logic
  ↓
Infrastructure
```

Example:

```typescript
async function hasPermission(
  session: Session | null,
  key: string,
): Promise<boolean> {
  return session?.user?.permissionKeys?.includes(key) ?? false;
}
```

---

# 11. Module Integration

RBAC is integrated into module Server Actions.

Standard module flow:

```text
UI
 ↓
Server Action
 ↓
Authentication
 ↓
Permission
 ↓
Application
 ↓
Infrastructure
 ↓
Database
```

Permission checks belong at the server boundary before protected business operations execute.

The application layer should contain business rules, not transport-specific authentication checks.

---

# 12. Route Rules

Route/menu access can be mapped to MENU permissions.

Example:

```typescript
const routeRules = [
  { pattern: /^\/reports/, required: ["menu.reports"] },
  { pattern: /^\/sales/, required: ["menu.sales"] },
  { pattern: /^\/products/, required: ["menu.products"] },
  { pattern: /^\/customers/, required: ["menu.customers"] },
  { pattern: /^\/employee/, required: ["menu.employees"] },
  { pattern: /^\/companies/, required: ["menu.companies"] },
  { pattern: /^\/credit-limits/, required: ["menu.credit_limits"] },
  {
    pattern: /^\/temporary-credit-limits/,
    required: ["menu.temporary_credit_limits"],
  },
  { pattern: /^\/fulfillment/, required: ["menu.fulfillment"] },
  { pattern: /^\/rbac/, required: ["rbac.manage"] },
  { pattern: /^\/admin/, required: ["menu.admin"] },
];
```

Do not treat route visibility as a replacement for server-side action permission checks.

---

# 13. Adding a New Permission

When adding a new permission:

1. Update the RBAC source of truth:
   `prisma/seed/rbac.ts`
2. Add/update documentation in `docs/RBAC_POLICY.md`.
3. Assign the permission to the appropriate roles.
4. Add a route rule if it is a MENU permission.
5. Add the required server-side permission check.
6. Update relevant module UI behavior when necessary.
7. Verify the session/permission representation when the new permission affects it.

Example:

```javascript
{
  key: "resource.action",
  name: "ชื่อภาษาไทย",
  category: "ACTION",
  resource: "resource",
  action: "action",
}
```

For DATA permissions, use the configured access/edit/delete scope fields where supported.

---

# 14. RBAC Rules for AI Agent

When creating or modifying protected functionality, the AI Agent MUST:

1. Read this document.
2. Check the current RBAC source of truth.
3. Identify the required permission key.
4. Check the relevant Server Action.
5. Enforce authentication before permission checks.
6. Enforce permission before protected business operations.
7. Apply the appropriate data access scope.
8. Keep authorization out of Infrastructure.
9. Keep business rules in Application.
10. Keep client-side permission checks as UI guidance only.
11. Avoid duplicating permission definitions in multiple locations.
12. Update documentation when permission behavior changes.

The AI Agent MUST NOT:

- Trust client-side permission checks as security.
- Bypass Server Action authorization.
- Add permissions without updating the RBAC source of truth.
- Hard-code role behavior in individual features when the RBAC system already defines it.
- Put authentication/authorization logic inside repository functions.
- Create a second RBAC mechanism inside a module.

---

# 15. RBAC and Module Architecture

RBAC follows the project-wide Module Architecture Contract.

```text
features/
    ↓
server/
    ↓
application/
    ↓
infrastructure/
```

Authorization belongs at the Server boundary.

Business rules that depend on the user's authorization context should be enforced through the appropriate application flow without moving authentication responsibilities into lower layers.

Infrastructure remains responsible for data access only.

---

# 16. Verification Checklist

Before considering an RBAC-related change complete:

### Permission

- [ ] Correct permission key identified.
- [ ] Permission exists in RBAC source of truth.
- [ ] Correct role assignment verified.
- [ ] User override behavior considered when applicable.

### Server

- [ ] Authentication checked.
- [ ] Permission checked.
- [ ] Data access scope checked when required.
- [ ] No security boundary relies only on client-side UI.

### Architecture

- [ ] Server Action remains thin.
- [ ] Business logic remains in application.
- [ ] Infrastructure contains no authorization logic.
- [ ] No duplicate RBAC architecture introduced.

### UI

- [ ] Client permission checks are consistent with server permissions.
- [ ] Unauthorized actions are hidden/disabled where appropriate.
- [ ] UI state does not replace server authorization.

### Verification

- [ ] Relevant permission scenarios tested.
- [ ] Unauthorized requests are rejected.
- [ ] Authorized requests behave correctly.
- [ ] Relevant tests/type-check/lint pass.

---

# 17. Source of Truth

Use the following sources according to their responsibility:

```text
RBAC definitions / role assignments
    → prisma/seed/rbac.ts

Database enums / RBAC data model
    → prisma/schema.prisma

System architecture
    → docs/ARCHITECTURE.md

Module architecture
    → docs/MODULE_ARCHITECTURE.md

Coding conventions
    → docs/CODING_STANDARDS.md

AI execution rules
    → .agents/skills/crm-coding-standards/SKILL.md

Current runtime behavior
    → current RBAC implementation
```

If this document conflicts with the current RBAC source of truth:

> **Trust the current RBAC source of truth and investigate the discrepancy before changing behavior.**

---

# 18. Related Documents

- [AI Context](./AI_CONTEXT.md)
- [Architecture](./ARCHITECTURE.md)
- [Module Architecture](./MODULE_ARCHITECTURE.md)
- [Data Model](./DATA_MODEL.md)
- [Coding Standards](./CODING_STANDARDS.md)
- [RBAC Seed](../prisma/seed/rbac.ts)
