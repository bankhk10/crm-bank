import { db } from "@/lib/db";

/**
 * Retrieve employee profile by ID
 */
export async function findEmployeeById(id: string) {
  return db.employee.findFirst({
    where: { id, deletedAt: null },
    include: {
      position: true,
      department: true,
    },
  });
}

/**
 * Retrieve employee profile by user ID
 */
export async function findEmployeeByUserId(userId: string) {
  return db.employee.findFirst({
    where: { userId, deletedAt: null },
    include: {
      position: true,
      department: true,
    },
  });
}

/**
 * Retrieve or auto-create employee profile for logged-in user
 */
export async function findOrCreateEmployeeForUser(
  userId: string,
  userName?: string,
  userEmail?: string,
) {
  let employee = await db.employee.findFirst({
    where: { userId, deletedAt: null },
    include: {
      position: true,
      department: true,
    },
  });

  if (employee) return employee;

  if (userEmail) {
    employee = await db.employee.findFirst({
      where: { email: userEmail, deletedAt: null },
      include: {
        position: true,
        department: true,
      },
    });

    if (employee) {
      if (!employee.userId) {
        await db.employee.update({
          where: { id: employee.id },
          data: { userId },
        });
      }
      return employee;
    }
  }

  const name = userName || "พนักงาน";
  const email = userEmail || `user-${userId}@crm.local`;

  const existingEmail = await db.employee.findFirst({ where: { email } });
  const finalEmail = existingEmail
    ? `emp-${userId.slice(-6)}@crm.local`
    : email;

  return db.employee.create({
    data: {
      name,
      email: finalEmail,
      userId,
    },
    include: {
      position: true,
      department: true,
    },
  });
}

/**
 * Clean up test or internal role annotations from Employee.name
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
 * Retrieve active Employee names for dynamic approver roles (Budget & Helper approvals).
 */
export async function getApproverDirectory(): Promise<ApproverDirectory> {
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

  const mktEmployees = await db.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        { positionTitle: { contains: "ผู้จัดการแผนกการตลาด" } },
        { positionTitle: { contains: "การตลาด-กิจกรรม" } },
        { positionTitle: { contains: "ผจก.แผนกการตลาด" } },
        { position: { name: { contains: "ผู้จัดการแผนกการตลาด" } } },
        { position: { name: { contains: "การตลาด-กิจกรรม" } } },
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
