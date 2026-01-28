# API Contracts - CRM System

> **Version**: 1.0.0 | **Updated**: 2026-01-28  
> **Base URL**: `/api`  
> **Related**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [DATA_MODEL.md](./DATA_MODEL.md)

---

## 1. Response Format

### Success Response
```json
{
  "data": { ... },
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
  "details": { ... }
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

### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "user": {
    "id": "cuid...",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "..."
}
```

### Get Session
```http
GET /api/auth/session

Response 200:
{
  "user": {
    "id": "...",
    "email": "...",
    "permissions": ["customer.read", "sale.create"]
  }
}
```

---

## 3. Customer Endpoints

### List Customers
```http
GET /api/customers
Query:
  ?page=1
  &limit=20
  &search=keyword
  &status=ACTIVE
  &customerType=DEALER

Response 200:
{
  "data": [
    {
      "id": "cuid...",
      "customerCode": "C0001",
      "name": "Customer Name",
      "customerType": "DEALER",
      "status": "ACTIVE"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

### Get Customer
```http
GET /api/customers/{id}

Response 200:
{
  "id": "cuid...",
  "customerCode": "C0001",
  "name": "Customer Name",
  "customerType": "DEALER",
  "status": "ACTIVE",
  "creditLimits": [
    {
      "limitAmount": 100000,
      "usedAmount": 50000,
      "availableAmount": 50000
    }
  ]
}
```

### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "customerCode": "C0002",
  "customerType": "DEALER",
  "name": "New Customer",
  "phone": "0891234567",
  "province": "กรุงเทพมหานคร"
}

Response 201:
{
  "id": "cuid...",
  "customerCode": "C0002",
  ...
}
```

### Update Customer
```http
PUT /api/customers/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "INACTIVE"
}

Response 200:
{
  "id": "cuid...",
  "name": "Updated Name",
  ...
}
```

---

## 4. Product Endpoints

### List Products
```http
GET /api/products
Query:
  ?page=1
  &limit=20
  &search=keyword
  &status=ACTIVE
  &productGroup=กลุ่มA

Response 200:
{
  "data": [
    {
      "id": "cuid...",
      "productCode": "P0001",
      "name": "Product Name",
      "price": 1500.00,
      "pointPerUnit": 10
    }
  ],
  "meta": { ... }
}
```

### Get Product with Stock
```http
GET /api/products/{id}

Response 200:
{
  "id": "cuid...",
  "productCode": "P0001",
  "name": "Product Name",
  "stock": {
    "physicalBalance": 100,
    "reservedQuantity": 20,
    "availableQuantity": 80
  }
}
```

---

## 5. Sales Endpoints

### List Sales
```http
GET /api/sales
Query:
  ?page=1
  &limit=20
  &status=PENDING_APPROVAL
  &customerId=cuid...
  &employeeId=cuid...
  &startDate=2026-01-01
  &endDate=2026-01-31

Response 200:
{
  "data": [
    {
      "id": "cuid...",
      "saleNumber": "SO202601-0001",
      "status": "PENDING_APPROVAL",
      "totalAmount": 50000.00,
      "customer": { "name": "..." },
      "employee": { "name": "..." }
    }
  ],
  "meta": { ... }
}
```

### Create Sale
```http
POST /api/sales
Content-Type: application/json

{
  "customerId": "cuid...",
  "employeeId": "cuid...",
  "paymentTerm": "CREDIT_90",
  "requestedDeliveryDate": "2026-02-01",
  "items": [
    {
      "productId": "cuid...",
      "quantity": 10,
      "unitPrice": 1500.00
    }
  ],
  "notes": "Urgent order"
}

Response 201:
{
  "id": "cuid...",
  "saleNumber": "SO202601-0002",
  "status": "PENDING",
  "totalAmount": 15000.00
}
```

### Approve Sale
```http
POST /api/sales/{id}/approve

Response 200:
{
  "id": "cuid...",
  "status": "APPROVED",
  "approvedAt": "2026-01-28T10:00:00Z"
}
```

### Reject Sale
```http
POST /api/sales/{id}/reject
Content-Type: application/json

{
  "reason": "Insufficient credit"
}

Response 200:
{
  "id": "cuid...",
  "status": "REJECTED",
  "rejectionReason": "Insufficient credit"
}
```

### Update Delivery Date
```http
PATCH /api/sales/{id}/delivery-date
Content-Type: application/json

{
  "deliveryDate": "2026-02-05"
}

Response 200:
{
  "id": "cuid...",
  "deliveryDate": "2026-02-05",
  "deliveryUpdateCount": 1
}

Error 400 (exceeded limit):
{
  "error": "DELIVERY_UPDATE_LIMIT_EXCEEDED",
  "message": "Cannot update delivery date more than 3 times"
}
```

---

## 6. Employee Endpoints

### List Employees
```http
GET /api/employee
Query:
  ?search=keyword
  &departmentId=cuid...

Response 200:
{
  "data": [
    {
      "id": "cuid...",
      "employeeCode": "E0001",
      "name": "Employee Name",
      "department": { "name": "Sales" }
    }
  ]
}
```

### Get Employee Points
```http
GET /api/employee/{id}/points
Query:
  ?year=2026
  &month=1

Response 200:
{
  "employeeId": "cuid...",
  "totalPoints": 5000,
  "pointsThisMonth": 500,
  "history": [
    {
      "saleNumber": "SO202601-0001",
      "productName": "Product A",
      "quantity": 10,
      "pointPerUnit": 10,
      "totalPoints": 100
    }
  ]
}
```

---

## 7. RBAC Endpoints

### List Roles
```http
GET /api/rbac/roles

Response 200:
{
  "data": [
    {
      "id": "cuid...",
      "name": "Admin",
      "slug": "admin",
      "isSystem": true
    }
  ]
}
```

### Get User Permissions
```http
GET /api/rbac/users/{userId}/permissions

Response 200:
{
  "permissions": [
    {
      "key": "customer.read",
      "dataAccess": "VIEW_ALL",
      "editAccess": "EDIT_ALL"
    }
  ]
}
```

---

## 8. Pagination

All list endpoints support:
```
?page=1          # Page number (1-indexed)
&limit=20        # Items per page (default: 20, max: 100)
```

Response includes:
```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 9. Filtering

### Common Filters
| Filter | Type | Example |
|--------|------|---------|
| search | string | `?search=keyword` |
| status | enum | `?status=ACTIVE` |
| startDate | date | `?startDate=2026-01-01` |
| endDate | date | `?endDate=2026-01-31` |

### Sorting
```
?sortBy=createdAt
&sortOrder=desc    # asc or desc
```

---

## 10. Required Headers

```http
Content-Type: application/json
Cookie: next-auth.session-token=...
```

---

**See Also**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [RBAC_POLICY.md](./RBAC_POLICY.md)
