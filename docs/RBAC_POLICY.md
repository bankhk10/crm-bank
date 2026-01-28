# RBAC Policy - CRM System

> **Version**: 1.1.0 | **Updated**: 2026-01-28  
> **Source of Truth**: `prisma/seed.js`  
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
| Administrator | `administrator` | Full system access (RBAC included) | Yes |
| Admin | `admin` | High-level access (excludes RBAC) | Yes |
| ผู้จัดการขาย | `sales_manager` | Department management + approval | No |
| พนักงานขาย | `sales_employee` | Basic sales operations | No |

### Role Hierarchy
```
Administrator > Admin > sales_manager > sales_employee
```

---

## 3. Permission Categories

```prisma
enum PermissionType {
  MENU    // Access to menu/page navigation
  ACTION  // Perform specific CRUD/business action
  DATA    // Data access scope (VIEW/EDIT/DELETE levels)
}
```

---

## 4. Complete Permission List

### 4.1 MENU Permissions (การเข้าถึงเมนู)

| Key | Name (TH) | Menu Path |
|-----|-----------|-----------|
| `menu.dashboard` | เมนูแดชบอร์ด | /dashboard |
| `menu.reports` | เมนูรายงาน | /reports |
| `menu.sales` | เมนูการขาย | /sales |
| `menu.products` | เมนูสินค้า | /products |
| `menu.customers` | เมนูลูกค้า | /customers |
| `menu.employees` | เมนูพนักงาน | /employee |
| `menu.companies` | เมนูบริษัท | /companies |
| `menu.credit_limits` | เมนูวงเงินสินเชื่อ | /credit-limits |
| `menu.temporary_credit_limits` | เมนูวงเงินสินเชื่อชั่วคราว | /temporary-credit-limits |
| `menu.fulfillment` | เมนูจัดส่งสินค้า | /fulfillment |
| `menu.sales_forecast` | เมนูคาดการณ์ยอดขาย | /sales-forecast |
| `menu.sales_targets` | เมนูตั้งเป้าหมายยอดขาย | /sales-targets |
| `menu.rbac` | เมนูจัดการสิทธิ์ | /rbac |
| `menu.admin` | เมนูตั้งค่าระบบ | /admin |
| `menu.notifications` | เมนูแจ้งเตือน | /notifications |

### 4.2 Report Permissions (รายงาน)

| Key | Name (TH) | Menu Path |
|-----|-----------|-----------|
| `report.time_sales` | รายงานยอดขายตามเวลา | /reports/time-sales |
| `report.product_sales` | รายงานตามสินค้า | /reports/product-sales |
| `report.product_group_sales` | รายงานตามกลุ่มสินค้า | /reports/product-group-sales |
| `report.customer_sales` | รายงานตามลูกค้า | /reports/customer-sales |
| `report.salesperson` | รายงานตามพนักงานขาย | /reports/salesperson |
| `report.export` | ส่งออกรายงาน | - |

### 4.3 Sale Permissions (การขาย)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `sale.create` | สร้างใบขาย | create |
| `sale.edit` | แก้ไขใบขาย | edit |
| `sale.view` | ดูรายละเอียดใบขาย | view |
| `sale.delete` | ลบใบขาย | delete |
| `sale.approve` | อนุมัติใบขาย | approve |
| `sale.reject` | ปฏิเสธใบขาย | reject |
| `sale.confirm-payment` | ยืนยันการชำระเงิน | confirm_payment |
| `sale.manage_fulfillment` | จัดการการจัดส่งสินค้า | manage_fulfillment |
| `sale.cancel` | ยกเลิกใบขาย | cancel |
| `sale.update_delivery` | แก้ไขวันส่ง | update_delivery |

### 4.4 Product Permissions (สินค้า)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `product.create` | สร้างสินค้า | create |
| `product.update` | แก้ไขสินค้า | update |
| `product.delete` | ลบสินค้า | delete |
| `product.view` | ดูรายละเอียดสินค้า | view |
| `product.manage` | จัดการสินค้า (ราคา, สต็อก, โปรโมชั่น) | manage |
| `product.import` | นำเข้าสินค้า | import |
| `product.export` | ส่งออกสินค้า | export |

### 4.5 Customer Permissions (ลูกค้า)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `customer.create.dealer` | สร้างลูกค้าตัวแทนจำหน่าย | create |
| `customer.create.subdealer` | สร้างลูกค้าตัวแทนจำหน่ายย่อย | create |
| `customer.create.farmer` | สร้างลูกค้าเกษตรกร | create |
| `customer.create.broker` | สร้างลูกค้านายหน้า | create |
| `customer.edit` | แก้ไขลูกค้า | edit |
| `customer.delete` | ลบลูกค้า | delete |
| `customer.view` | ดูรายละเอียดลูกค้า | view |
| `customer.import` | นำเข้าข้อมูลลูกค้า | import |
| `customer.export` | ส่งออกข้อมูลลูกค้า | export |
| `customer.assign` | กำหนดพนักงานดูแล | assign |

### 4.6 Credit Limit Permissions (วงเงินเครดิต)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `creditlimit.create` | สร้างวงเงินสินเชื่อ | create |
| `creditlimit.edit` | แก้ไขวงเงินสินเชื่อ | edit |
| `creditlimit.delete` | ลบวงเงินสินเชื่อ | delete |
| `creditlimit.view` | ดูรายละเอียดวงเงินสินเชื่อ | view |
| `creditlimit.approve` | อนุมัติวงเงินสินเชื่อ | approve |
| `creditlimit.reject` | ปฏิเสธวงเงินสินเชื่อ | reject |

### 4.7 Temporary Credit Limit Permissions (วงเงินชั่วคราว)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `temporary_creditlimit.create` | สร้างวงเงินสินเชื่อชั่วคราว | create |
| `temporary_creditlimit.edit` | แก้ไขวงเงินสินเชื่อชั่วคราว | edit |
| `temporary_creditlimit.delete` | ลบวงเงินสินเชื่อชั่วคราว | delete |
| `temporary_creditlimit.view` | ดูรายละเอียดวงเงินสินเชื่อชั่วคราว | view |
| `temporary_creditlimit.approve` | อนุมัติวงเงินสินเชื่อชั่วคราว | approve |
| `temporary_creditlimit.reject` | ปฏิเสธวงเงินสินเชื่อชั่วคราว | reject |

### 4.8 Employee Permissions (พนักงาน)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `employee.view` | ดูรายละเอียดพนักงาน | view |
| `employee.manage` | จัดการพนักงาน | edit |
| `employee.create` | สร้างพนักงาน | create |
| `employee.delete` | ลบพนักงาน | delete |
| `employee.assign_manager` | กำหนดหัวหน้า | assign |

### 4.9 Company Permissions (บริษัท)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `company.create` | สร้างบริษัท | create |
| `company.edit` | แก้ไขบริษัท | edit |
| `company.delete` | ลบบริษัท | delete |
| `company.view` | ดูรายละเอียดบริษัท | view |

### 4.10 RBAC Management Permissions (จัดการสิทธิ์)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `rbac.manage` | จัดการสิทธิ์ผู้ใช้ | manage |
| `rbac.role.create` | สร้าง Role | create |
| `rbac.role.edit` | แก้ไข Role | edit |
| `rbac.role.delete` | ลบ Role | delete |
| `rbac.permission.assign` | กำหนด Permission | assign |
| `rbac.user.override` | Override สิทธิ์ผู้ใช้ | override |

### 4.11 Sales Target Permissions (เป้าหมายยอดขาย)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `sales_target.view` | ดูเป้าหมายยอดขาย | view |
| `sales_target.create` | สร้างเป้าหมายยอดขาย | create |
| `sales_target.edit` | แก้ไขเป้าหมายยอดขาย | edit |
| `sales_target.delete` | ลบเป้าหมายยอดขาย | delete |

### 4.12 Stock/Inventory Permissions (คลังสินค้า)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `stock.view` | ดูสต็อกสินค้า | view |
| `stock.adjust` | ปรับปรุงสต็อก | adjust |
| `stock.lot.manage` | จัดการ LOT | manage |

### 4.13 Notification Permissions (แจ้งเตือน)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `notification.view` | ดูการแจ้งเตือน | view |
| `notification.manage` | จัดการการแจ้งเตือน | manage |

### 4.14 System Permissions (ระบบ)

| Key | Name (TH) | Action |
|-----|-----------|--------|
| `system.audit_log` | ดู Audit Log | view |
| `system.security_log` | ดู Security Log | view |
| `system.settings` | ตั้งค่าระบบ | manage |
| `randomize` | สุ่มข้อมูล (Dev only) | randomize |

### 4.15 DATA Permissions (ขอบเขตข้อมูล)

| Key | Name (TH) | Resource |
|-----|-----------|----------|
| `data.sales` | ขอบเขตข้อมูลการขาย | sale |
| `data.products` | ขอบเขตข้อมูลสินค้า | product |
| `data.customers` | ขอบเขตข้อมูลลูกค้า | customer |
| `data.employees` | ขอบเขตข้อมูลพนักงาน | employee |
| `data.creditlimits` | ขอบเขตข้อมูลวงเงินสินเชื่อ | creditlimit |
| `data.temporary_creditlimits` | ขอบเขตข้อมูลวงเงินชั่วคราว | temporary_creditlimit |

---

## 5. Data Access Levels

### 5.1 View Access
```typescript
enum DataAccessLevel {
  VIEW_OWN         // ดูได้เฉพาะของตัวเอง
  VIEW_DEPARTMENT  // ดูได้เฉพาะแผนกตัวเอง
  VIEW_ALL         // ดูได้ทั้งหมด
}
```

### 5.2 Edit Access
```typescript
enum EditAccessLevel {
  EDIT_NONE        // แก้ไขไม่ได้
  EDIT_OWN         // แก้ไขได้เฉพาะของตัวเอง
  EDIT_DEPARTMENT  // แก้ไขได้เฉพาะแผนกตัวเอง
  EDIT_ALL         // แก้ไขได้ทั้งหมด
}
```

### 5.3 Delete Access
```typescript
enum DeleteAccessLevel {
  DELETE_NONE        // ลบไม่ได้
  DELETE_OWN         // ลบได้เฉพาะของตัวเอง
  DELETE_DEPARTMENT  // ลบได้เฉพาะแผนกตัวเอง
  DELETE_ALL         // ลบได้ทั้งหมด
}
```

---

## 6. Role-Permission Matrix

### Administrator (Full Access)
- ✅ All MENU permissions
- ✅ All ACTION permissions
- ✅ DATA: VIEW_ALL, EDIT_ALL, DELETE_ALL
- ✅ RBAC management

### Admin (High-Level, No RBAC)
| Category | Permissions |
|----------|-------------|
| MENU | dashboard, reports, sales, products, customers, employees, companies, credit_limits, temporary_credit_limits, fulfillment, sales_forecast, sales_targets |
| Reports | All report types |
| Sale | create, edit, view, delete, approve, reject, confirm-payment, manage_fulfillment |
| Product | create, update, delete, view, manage |
| Customer | All customer types create, edit, delete, view |
| Credit | All credit + temporary credit operations |
| Employee | view, manage |
| DATA | VIEW_ALL, EDIT_ALL, DELETE_ALL |
| ❌ | rbac.* |

### Sales Manager
| Category | Permissions |
|----------|-------------|
| MENU | dashboard, products, sales, customers, employees, credit_limits |
| Sale | create, edit, view, delete, approve, reject |
| Product | view only (VIEW_ALL) |
| Customer | All types create, edit, view |
| Credit | create, edit, delete, view, approve, reject |
| Employee | view (VIEW_DEPARTMENT) |
| DATA | VIEW_DEPARTMENT, EDIT_OWN, DELETE_OWN |

### Sales Employee
| Category | Permissions |
|----------|-------------|
| MENU | products, sales, customers, temporary_credit_limits |
| Sale | create, edit, view, delete |
| Product | view only (VIEW_ALL) |
| Customer | dealer create, edit, view |
| Temporary Credit | create, edit, view, delete |
| Employee | view (VIEW_ALL, read-only) |
| DATA | VIEW_OWN, EDIT_OWN, DELETE_OWN |

---

## 7. Permission Override

### User-Level Override
```prisma
model UserPermissionOverride {
  userId       String
  permissionId String
  allow        Boolean           // true = grant, false = deny
  dataAccess   DataAccessLevel?
  editAccess   EditAccessLevel?
  deleteAccess DeleteAccessLevel?
  reason       String?           // Required for audit
}
```

### Override Priority
```
1. UserPermissionOverride (Highest)
2. RolePermission
3. Default (Deny)

Note: allow = false always wins (explicit deny)
```

---

## 8. Permission Check Flow

```typescript
async function checkPermission(userId: string, key: string): boolean {
  // 1. Check user overrides first
  const override = await getOverride(userId, key);
  if (override) return override.allow;
  
  // 2. Check role permissions
  const roles = await getUserRoles(userId);
  for (const role of roles) {
    const perm = await getRolePermission(role.id, key);
    if (perm?.allow) return true;
  }
  
  // 3. Default deny
  return false;
}
```

---

## 9. API Guard Pattern

```typescript
// Example: app/api/sales/route.ts
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  
  // Check action permission
  if (!hasPermission(session, 'sale.create')) {
    return forbidden();
  }
  
  // For DATA permission, apply filter
  const dataAccess = getDataAccess(session, 'sale');
  const filter = buildFilter(dataAccess, session.user);
  
  // Continue with business logic...
}
```

---

## 10. Route Rules

```typescript
const routeRules = [
  { pattern: /^\/reports/, required: ['menu.reports'] },
  { pattern: /^\/sales/, required: ['menu.sales'] },
  { pattern: /^\/products/, required: ['menu.products'] },
  { pattern: /^\/customers/, required: ['menu.customers'] },
  { pattern: /^\/employee/, required: ['menu.employees'] },
  { pattern: /^\/companies/, required: ['menu.companies'] },
  { pattern: /^\/credit-limits/, required: ['menu.credit_limits'] },
  { pattern: /^\/temporary-credit-limits/, required: ['menu.temporary_credit_limits'] },
  { pattern: /^\/fulfillment/, required: ['menu.fulfillment'] },
  { pattern: /^\/rbac/, required: ['rbac.manage'] },
  { pattern: /^\/admin/, required: ['menu.admin'] },
];
```

---

## 11. Adding New Permissions

### Checklist
1. Add to `prisma/seed.js` in permissions array
2. Update documentation in `docs/RBAC_POLICY.md`
3. Assign to appropriate roles in seed config
4. Add route rule if MENU permission
5. Implement check in API route

### Template
```javascript
prisma.permission.create({
  data: {
    key: 'resource.action',
    name: 'ชื่อภาษาไทย',
    category: 'ACTION', // MENU | ACTION | DATA
    resource: 'resource',
    action: 'action',
    // For DATA type:
    defaultDataAccess: 'VIEW_DEPARTMENT',
    defaultEditAccess: 'EDIT_OWN',
    defaultDeleteAccess: 'DELETE_OWN',
  },
})
```

---

## 12. Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-28 | 1.1.0 | Added comprehensive permission list |
| 2026-01-28 | 1.0.0 | Initial RBAC policy |

---

**See Also**: [AI_CONTEXT.md](./AI_CONTEXT.md) | [API_CONTRACTS.md](./API_CONTRACTS.md) | [CODING_STANDARDS.md](./CODING_STANDARDS.md)
