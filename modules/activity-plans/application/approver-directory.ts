import { db } from "@/lib/db";

/**
 * Clean up test or internal role annotations from Employee.name
 * e.g., "สมคิด บริหารงานขาย (ผจก.แผนก SA)" -> "สมคิด บริหารงานขาย"
 * e.g., "วรัญญา การตลาด" -> "วรัญญา การตลาด"
 */
export function formatEmployeeName(name?: string | null): string {
  if (!name) return "";
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export interface ApproverDirectory {
  salesAdminEmployees: string[];
  marketingEmployees: string[];
  salesDirectorEmployees: string[];
}

/**
 * Use Case: Retrieve active Employee names for dynamic approver roles (Budget & Helper approvals).
 * Source of Truth is Employee.name from Employee table.
 */
export async function getApproverDirectoryUseCase(): Promise<ApproverDirectory> {
  // 1. Sales Admin Manager (SA department managers / Sales Admin managerial roles)
  const saEmployees = await db.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { positionTitle: { contains: "บริหารงานขาย" } },
        { position: { name: { contains: "บริหารงานขาย" } } },
        {
          AND: [
            { department: { code: "SA" } },
            {
              OR: [
                { positionTitle: { contains: "ผู้จัดการ" } },
                { position: { isManagerial: true } },
              ],
            },
            { positionTitle: { not: { contains: "ภาค" } } },
            { positionTitle: { not: { contains: "ฝ่ายขาย" } } },
            { position: { name: { not: { contains: "ภาค" } } } },
            { position: { name: { not: { contains: "ฝ่ายขาย" } } } },
          ],
        },
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 2. Marketing Manager (MKT department managers / Marketing managerial roles)
  const mktEmployees = await db.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { positionTitle: { contains: "ผู้จัดการแผนกการตลาด" } },
        { positionTitle: { contains: "ผจก.แผนกการตลาด" } },
        { position: { name: { contains: "ผู้จัดการแผนกการตลาด" } } },
        {
          AND: [
            { department: { code: "MKT" } },
            {
              OR: [
                { positionTitle: { contains: "ผู้จัดการ" } },
                { position: { isManagerial: true } },
              ],
            },
          ],
        },
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 3. Sales Director (Sales Department Director / Head of Sales)
  const dirEmployees = await db.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { positionTitle: { contains: "ผู้จัดการฝ่ายขาย" } },
        { positionTitle: { contains: "ผจก.ฝ่ายขาย" } },
        { positionTitle: { contains: "Sales Director" } },
        { position: { name: { contains: "ผู้จัดการฝ่ายขาย" } } },
      ],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const uniqueFormatted = (list: Array<{ name: string }>) =>
    Array.from(new Set(list.map((e) => formatEmployeeName(e.name)).filter(Boolean)));

  return {
    salesAdminEmployees: uniqueFormatted(saEmployees),
    marketingEmployees: uniqueFormatted(mktEmployees),
    salesDirectorEmployees: uniqueFormatted(dirEmployees),
  };
}
