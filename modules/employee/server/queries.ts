import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";

export type GetEmployeesParams = {
  page?: number;
  perPage?: number;
  q?: string;
  from?: Date;
  to?: Date;
};

export async function getEmployees(params: GetEmployeesParams) {
  const { page = 1, perPage = 12, q, from, to } = params;

  const where: Prisma.EmployeeWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { employeeCode: { contains: q, mode: "insensitive" } },
    ];
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: startOfDay(from) } : {}),
      ...(to ? { lte: endOfDay(to) } : {}),
    };
  }

  const [total, employees] = await Promise.all([
    db.employee.count({ where }),
    db.employee.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { total, employees };
}

export async function getEmployee(id: string) {
  const employee = await db.employee.findFirst({
    where: { id, deletedAt: null },
    include: {
      company: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      responsibleCustomers: {
        select: {
          id: true,
          customerCode: true,
          name: true,
          province: true,
          region: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          userRoles: {
            where: { deletedAt: null },
            include: { role: true },
          },
        },
      },
    },
  });
  return employee;
}
