"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

export type DemoTableRow = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  branch: string;
  owner: string;
  status: "active" | "pending" | "disabled";
  createdAt: string;
  updatedAt: string;
  revenue: string;
};

const demoRows: DemoTableRow[] = [
  {
    id: "CUS-0001",
    customer: "บริษัท ทดสอบ จำกัด",
    email: "contact@demo.co.th",
    phone: "02-555-1000",
    branch: "กรุงเทพฯ",
    owner: "พิชญา",
    status: "active",
    createdAt: "10/01/2024",
    updatedAt: "12/02/2024",
    revenue: "฿420,000",
  },
  {
    id: "CUS-0002",
    customer: "บริษัท สยามเทค จำกัด",
    email: "hello@siamtech.co.th",
    phone: "02-555-1212",
    branch: "เชียงใหม่",
    owner: "ศิริพร",
    status: "pending",
    createdAt: "15/01/2024",
    updatedAt: "18/02/2024",
    revenue: "฿180,500",
  },
  {
    id: "CUS-0003",
    customer: "ห้างหุ้นส่วน เพชรบุรี",
    email: "support@phetburi.co.th",
    phone: "02-555-1313",
    branch: "เพชรบุรี",
    owner: "ธนเดช",
    status: "active",
    createdAt: "20/01/2024",
    updatedAt: "20/02/2024",
    revenue: "฿95,000",
  },
  {
    id: "CUS-0004",
    customer: "บริษัท อรุณกรุ๊ป",
    email: "contact@arungroup.co.th",
    phone: "02-555-1414",
    branch: "ขอนแก่น",
    owner: "กมล",
    status: "disabled",
    createdAt: "28/01/2024",
    updatedAt: "25/02/2024",
    revenue: "฿0",
  },
  {
    id: "CUS-0005",
    customer: "บริษัท ลีดเดอร์ จำกัด",
    email: "sales@leader.co.th",
    phone: "02-555-1515",
    branch: "ชลบุรี",
    owner: "รจนา",
    status: "active",
    createdAt: "02/02/2024",
    updatedAt: "01/03/2024",
    revenue: "฿620,000",
  },
  {
    id: "CUS-0006",
    customer: "บริษัท ทรัพย์เจริญ",
    email: "hello@subcharoen.co.th",
    phone: "02-555-1616",
    branch: "นครราชสีมา",
    owner: "ณัฐธิดา",
    status: "pending",
    createdAt: "06/02/2024",
    updatedAt: "05/03/2024",
    revenue: "฿240,200",
  },
  {
    id: "CUS-0007",
    customer: "บริษัท โกลบอล เทรดดิ้ง",
    email: "support@globaltrade.co.th",
    phone: "02-555-1717",
    branch: "กรุงเทพฯ",
    owner: "พงศกร",
    status: "active",
    createdAt: "08/02/2024",
    updatedAt: "07/03/2024",
    revenue: "฿880,000",
  },
  {
    id: "CUS-0008",
    customer: "บริษัท ดาวรุ่งพัฒนา",
    email: "info@daorung.co.th",
    phone: "02-555-1818",
    branch: "พิษณุโลก",
    owner: "วชิรา",
    status: "active",
    createdAt: "10/02/2024",
    updatedAt: "10/03/2024",
    revenue: "฿310,000",
  },
  {
    id: "CUS-0009",
    customer: "บริษัท เจริญสุข",
    email: "contact@charoensuk.co.th",
    phone: "02-555-1919",
    branch: "สุราษฎร์ธานี",
    owner: "ปารมี",
    status: "pending",
    createdAt: "14/02/2024",
    updatedAt: "12/03/2024",
    revenue: "฿140,900",
  },
  {
    id: "CUS-0010",
    customer: "บริษัท แสงไทย",
    email: "hello@sangthai.co.th",
    phone: "02-555-2020",
    branch: "นครศรีธรรมราช",
    owner: "ณัฐพล",
    status: "disabled",
    createdAt: "16/02/2024",
    updatedAt: "15/03/2024",
    revenue: "฿0",
  },
];

const statusLabel: Record<DemoTableRow["status"], string> = {
  active: "ใช้งานอยู่",
  pending: "รอดำเนินการ",
  disabled: "ปิดใช้งาน",
};

const statusVariant: Record<DemoTableRow["status"], "default" | "outline" | "secondary"> = {
  active: "default",
  pending: "secondary",
  disabled: "outline",
};

export default function DemoDataTable() {
  const columns = React.useMemo<ColumnDef<DemoTableRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: "รหัสลูกค้า",
        meta: { minWidth: 140 },
      },
      {
        accessorKey: "customer",
        header: "ชื่อลูกค้า",
        meta: { minWidth: 220 },
      },
      {
        accessorKey: "email",
        header: "อีเมล",
        meta: { minWidth: 220 },
      },
      {
        accessorKey: "phone",
        header: "เบอร์โทร",
        meta: { minWidth: 160 },
      },
      {
        accessorKey: "branch",
        header: "สาขา",
        meta: { minWidth: 140 },
      },
      {
        accessorKey: "owner",
        header: "ผู้ดูแล",
        meta: { minWidth: 160 },
      },
      {
        accessorKey: "status",
        header: "สถานะ",
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>
            {statusLabel[row.original.status]}
          </Badge>
        ),
        meta: { minWidth: 140 },
      },
      {
        accessorKey: "createdAt",
        header: "วันที่สร้าง",
        meta: { minWidth: 140 },
      },
      {
        accessorKey: "updatedAt",
        header: "อัปเดตล่าสุด",
        meta: { minWidth: 160 },
      },
      {
        accessorKey: "revenue",
        header: "ยอดซื้อรวม",
        meta: { minWidth: 160, align: "right", headerAlign: "right" },
      },
      {
        id: "actions",
        header: "การทำงาน",
        cell: () => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              ดูรายละเอียด
            </Button>
            <Button size="sm" variant="ghost">
              แก้ไข
            </Button>
          </div>
        ),
        meta: { minWidth: 200 },
      },
    ],
    []
  );

  return <DataTable columns={columns} data={demoRows} />;
}
