crm/
├── 📁 app/                     # โฟลเดอร์หลักของ App Router
│   │
│   ├── 📁 (auth)/              # (1) Route Group สำหรับหน้า Authentication
│   │   ├── 📁 login/
│   │   │   └── page.tsx
│   │   ├── 📁 register/
│   │   │   └── page.tsx
│   │   └── layout.tsx          # Layout เฉพาะของกลุ่ม (auth) (เช่น แสดงฟอร์มกลางจอ)
│   │
│   ├── 📁 (main)/               # (2) Route Group สำหรับหน้าหลักของแอป (ที่ต้อง Login)
│   │   ├── 📁 dashboard/
│   │   │   ├── 📁 aggregateReport/  
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 salesReport/
│   │   │   │   └── page.tsx
│   │   │   └── 📁 activityReport/
│   │   │       └── page.tsx
│   │   │
│   │   ├── 📁 employee/
│   │   │   ├── page.tsx        # หน้า /employee (แสดงตาราง)
│   │   │   ├── 📁 [employeeId]/  # (3) Dynamic Route สำหรับดู/แก้ไข
│   │   │   │   └── page.tsx    # หน้า /employee/123
│   │   │   └── new/            # หน้า /employee/new
│   │   │       └── page.tsx
│   │   │
│   │   ├── 📁 companies/        # (เหมือน employee)
│   │   │   ├── page.tsx
│   │   │   ├── 📁 [companyId]/
│   │   │   │   └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   │
│   │   └── layout.tsx          # (4) Layout หลักของแอป (มี Sidebar, Navbar)
│   │
│   ├── 📁 api/                  # (5) API Routes (สำหรับ Backend Logic)
│   │   ├── 📁 auth/             # เช่น /api/auth/[...nextauth]
│   │   ├── 📁 employee/
│   │   │   └── route.ts
│   │   ├── 📁 companies/
│   │   │   └── route.ts
│   │   └── ...
│   │
│   ├── layout.tsx              # Root Layout (<html>, <body>)
│   └── page.tsx                # หน้าแรกสุด (Homepage /)
│
├── 📁 components/             # (6) โฟลเดอร์สำหรับ Reusable Components
│   ├── 📁 ui/                   # Components พื้นฐาน (Button, Input, Card)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── 📁 features/             # Components ที่ใช้เฉพาะ Feature (มีความซับซ้อน)
│   │   ├── employee/
│   │   │   ├── employee-form.tsx
│   │   │   └── employee-table.tsx
│   │   ├── companies/
│   │   │   └── companies-kanban-board.tsx
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       ├── navbar.tsx
│   │       └── ...
│   │
├── 📁 lib/                    # (7) โฟลเดอร์สำหรับ Helpers, Utilities
│   ├── auth.ts                 # การตั้งค่า NextAuth.js
│   ├── db.ts                   # การเชื่อมต่อ Database (เช่น Prisma Client)
│   ├── utils.ts                # ฟังก์ชันช่วยเหลือทั่วไป
│
├── 📁 hooks/                  # (8) Custom React Hooks
│   ├── use-current-user.ts
│   └── use-modal-store.ts
│
├── 📁 types/                  # (9) TypeScript types แยกตามโมดูล
│   ├── customer.ts 
│   └── companies.ts          
│
├── 📁 public/                 # เก็บไฟล์ Static (รูปภาพ, ไอคอน)
│
├── .env.local                # เก็บ Environment Variables (เช่น DB connection string)
├── next.config.mjs           # ไฟล์ตั้งค่า Next.js
└── tsconfig.json             # ไฟล์ตั้งค่า TypeScript