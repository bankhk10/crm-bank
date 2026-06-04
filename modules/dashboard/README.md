# Dashboard Module

This module is responsible for rendering the dashboard interface tailored to different user roles (Admin, Manager, Sales, Employee). It follows a clean, layered architecture pattern designed for maintainability and scalability.

## Architecture & Directory Structure

The module follows the standard "Employee Pattern" (Layered Architecture):

```
dashboard/
├── application/     # Application logic (e.g., Use cases, business logic)
├── features/        # Role-based container views and their specific UI components
│   ├── admin/
│   ├── employee/
│   ├── manager/
│   └── sales/
├── infrastructure/  # Data access layer (e.g., Prisma repositories, queries)
├── server/          # Server actions and API routes exposed to the client
├── types/           # Shared TypeScript interfaces and types for the module
├── ui/              # Shared, reusable UI components used across multiple dashboards
└── index.ts         # Public API barrel file for the dashboard module
```

## Dashboard Features

Each role-specific dashboard is separated into its own directory under `features/`. To keep the code maintainable, we avoid monolithic files and split complex dashboards into a **"Smart" Container** and **"Dumb" Presentational Components**.

### Container Views
The main entry point for each role (e.g., `sales-dashboard-view.tsx`). It acts as a "Smart" component that handles:
- Fetching and managing state (e.g., `useState`, `useEffect` for auto-refreshing data).
- Managing global filtering state (e.g., currently selected period: Day/Month/Year).
- Distributing data as props to the presentational components.

### Presentational Components
Located in the `components/` subfolder inside each feature (e.g., `features/sales/components/`).
- **`[role]-kpi-cards.tsx`**: Renders the top-level metric cards (Monthly Sales, Target, YTD).
- **`[role]-charts-section.tsx`**: Renders the charts and handles local UI state (like filtering which groups are visible).

## Shared UI (`/ui`)

To prevent code duplication, generic components used across multiple role dashboards are extracted to the `ui/` directory:
- **`format-utils.ts`**: Utilities for formatting currency, compact numbers, and generic strings for the Thai locale.
- **`period-switcher.tsx`**: A pill-styled toggle component used to switch between "วัน" (Day), "เดือน" (Month), and "ปี" (Year).
- **`dashboard-charts.tsx`**: Contains reusable Recharts visualizations (`RegionChart`, `ProductGroupChart`, `TradeNameGroupChart`) and hooks (`useIsMobile`) to ensure consistent styling across roles.

## Best Practices
1. **Adding new charts**: If a new chart is used by multiple roles, add it to `ui/dashboard-charts.tsx`. If it is highly specific to one role, add it to that role's `components/` folder.
2. **State Management**: Keep API polling and top-level period state inside the View container. Keep filter/toggle state (like hiding a specific product group) local to the `charts-section` component.
3. **Data Fetching**: The `features/` layer should not access the database directly. Use server actions from `server/` which internally call Use Cases from `application/` and Repositories from `infrastructure/`.

## Data Calculation & Business Logic

หากต้องการดูเงื่อนไขหรือสูตรการคำนวณค่าต่างๆ บน Dashboard สามารถแบ่งออกได้เป็น 2 ส่วนหลักๆ ตาม Layer Architecture:

1. **การรวมข้อมูลและการคำนวณฝั่ง Backend (Application Layer)**
   ข้อมูลดิบจากฐานข้อมูล (เช่น การรวมยอดขาย Invoice, Sales Note, หรือเป้ายอดขาย Target) จะถูก Query และคำนวณผ่าน Use Cases ที่อยู่ในโฟลเดอร์ `application/`
   - `get-dashboard-data.ts`: จัดการเรื่องดึงข้อมูลและคำนวณรวมสำหรับภาพรวมขององค์กร (ใช้ใน Admin และ Manager Dashboard)
   - `get-sales-dashboard-data.ts`: จัดการดึงข้อมูลและคำนวณโดยฟิลเตอร์ตามพนักงานขายแต่ละคน (ใช้ใน Sales Dashboard)
   *(เงื่อนไขเช่น: การเปรียบเทียบข้อมูลปีปัจจุบันกับปีที่แล้วเพื่อหา `growthPercent`, หรือการนับจำนวนใบ Job Status ว่าสำเร็จ/ไม่ผ่าน จะถูกเขียนลอจิกไว้ใน 2 ไฟล์นี้เป็นหลัก)*

2. **การคำนวณเพื่อการแสดงผล (Presentation Layer)**
   การคำนวณเล็กๆ น้อยๆ ที่เกี่ยวข้องกับการแสดงผล UI โดยเฉพาะ (เช่น เปอร์เซ็นต์ความคืบหน้าของเป้าหมาย, ยอดเงินส่วนต่างที่เหลือ) จะคำนวณสดๆ (On the fly) ในไฟล์ Component:
   - ตรวจสอบได้ที่ไฟล์ `features/[role]/components/[role]-kpi-cards.tsx`
   - ตัวอย่างเช่น การหาเป้าหมาย `percent = (target.current / target.target) * 100` หรือ `remaining = target.target - target.current` จะอยู่ใน Component เหล่านี้ครับ
