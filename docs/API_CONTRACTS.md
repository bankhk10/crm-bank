# API Contracts - CRM System

> **Version**: 1.1.0 | **Updated**: 2026-02-09  
> **Base URL**: `/api`  
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [DATA_MODEL.md](./DATA_MODEL.md)

---

## 1. Response Format (Common Pattern)

### Success Response
```json
{
  "data": { "...": "..." },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": { "...": "..." }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | No permission |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input |
| CONFLICT | 409 | Duplicate/conflict |
| INTERNAL_ERROR | 500 | Server error |

---

## 2. Authentication

> ระบบใช้ NextAuth (Credentials Provider)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/[...nextauth]` | GET/POST | NextAuth handler (signin, signout, session) |
| `/auth/register` | POST | ลงทะเบียนผู้ใช้ใหม่ (ภายในระบบ) |

---

## 3. Core Business APIs (Snapshot)

> เส้นทางจริงตรวจสอบจาก `app/api/**/route.ts`

### Customers & Companies
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/customers` | GET/POST | List + create customers |
| `/customers/[customerId]` | GET/PUT/DELETE | Customer detail/update/delete (soft) |
| `/customers/check-code` | GET | ตรวจสอบรหัสลูกค้า |
| `/customers/generate-code` | GET | สร้างรหัสลูกค้าใหม่ |
| `/companies` | GET/POST | List + create companies |
| `/companies/[companyId]` | GET/PUT/DELETE | Company detail/update/delete (soft) |

### Credit Limits
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/credit-limits` | GET/POST | วงเงินเครดิตถาวร |
| `/credit-limits/[creditLimitId]` | GET/PUT/DELETE | แก้ไขวงเงินเครดิตถาวร |
| `/temporary-credit-limits` | GET/POST | วงเงินเครดิตชั่วคราว |
| `/temporary-credit-limits/[temporaryCreditLimitId]` | GET/PUT/DELETE | แก้ไขวงเงินเครดิตชั่วคราว |
| `/temporary-credit-limits/expire` | POST | ปรับสถานะวงเงินชั่วคราวหมดอายุ |

### Products
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET/POST | รายการสินค้า |
| `/products/[productId]` | GET/PUT/DELETE | รายละเอียดสินค้า |
| `/products/categories` | GET | หมวดสินค้า |
| `/products/product-groups` | GET | กลุ่มสินค้า |
| `/products/groups` | GET | Master group definitions |
| `/products/brands` | GET | แบรนด์สินค้า |
| `/products/units` | GET | หน่วยสินค้า |
| `/products/plants` | GET | พืชที่ใช้ได้ |
| `/products/chemical-groups` | GET | กลุ่มสาร |

### Sales & Fulfillment
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sales` | GET/POST | รายการใบขาย + สร้างใบขาย |
| `/sales/[id]` | GET/PUT/DELETE | รายละเอียด/แก้ไข/ยกเลิกใบขาย |
| `/sales/summary` | GET | สรุปยอดขาย (ตาม filter) |
| `/sales-forecast` | GET | คาดการณ์ยอดขาย |
| `/sales-targets` | GET/POST | เป้าหมายยอดขาย |

### Employees & RBAC
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/employee` | GET/POST | รายการพนักงาน |
| `/employee/[employeeId]` | GET/PUT/DELETE | รายละเอียดพนักงาน |
| `/rbac/catalog` | GET | Permission catalog |
| `/rbac/permissions` | GET | รายการ permission |
| `/rbac/roles` | GET/POST | จัดการ role |
| `/rbac/departments` | GET/POST | จัดการ department |
| `/rbac/positions` | GET/POST | จัดการ position |
| `/rbac/summary` | GET | สรุปสิทธิ์ของผู้ใช้ |

### Notifications & Dashboard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications` | GET | รายการแจ้งเตือนผู้ใช้ |
| `/notifications/read-all` | POST | ทำเครื่องหมายอ่านทั้งหมด |
| `/dashboard/admin` | GET | สรุปข้อมูลแดชบอร์ด (ผู้ดูแล) |

### Utilities & System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/thai-addresses` | GET | ที่อยู่ประเทศไทย (จังหวัด/อำเภอ/ตำบล) |
| `/health` | GET | Health check |
| `/cron/order-expiry` | POST | งานกำหนดสถานะใบขายหมดอายุ |
| `/cron/check-expired` | POST | งานตรวจสอบข้อมูลหมดอายุ |
| `/random-fill/sale` | POST | สร้างข้อมูลตัวอย่าง (Dev) |
| `/random-fill/images` | POST | เติมรูปตัวอย่าง (Dev) |

---

## 4. Notes for New Features

- เพิ่ม endpoint ใหม่ต้องอยู่ใน `app/api/<resource>/route.ts`
- ต้องมี **auth + permission check** ทุกครั้ง
- ใช้ `lib/db.ts` สำหรับ Prisma client
- ต้องคงมาตรฐาน response format (data/meta หรือ error)

---

**See Also**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [RBAC_POLICY.md](./RBAC_POLICY.md)
