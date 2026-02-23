import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ListEmployeesParams = {
  page?: number;
  perPage?: number;
  q?: string;
  from?: Date;
  to?: Date;
};

// ─────────────────────────────────────────────
// Repository Functions (Data Access Layer)
// ─────────────────────────────────────────────

/**
 * Retrieve a paginated list of employees with optional search & date filtering.
 */
export async function findEmployees(params: ListEmployeesParams) {
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

/**
 * Retrieve a single employee by ID with full relation data.
 */
export async function findEmployeeById(id: string) {
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

/**
 * Retrieve all active employees (simple list for dropdowns, etc.)
 */
export async function findAllEmployees() {
  return db.employee.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      company: {
        select: { id: true, name: true },
      },
      position: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Find employee by email.
 */
export async function findEmployeeByEmail(email: string) {
  return db.employee.findUnique({ where: { email } });
}

/**
 * Find user by email.
 */
export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

/**
 * Find role by ID.
 */
export async function findRoleById(id: string) {
  return db.role.findUnique({ where: { id } });
}

/**
 * Create employee within a transaction.
 */
export async function createEmployee(data: {
  employeeData: any;
  userData?: {
    name: string;
    email: string;
    password: string;
    roleId: string;
  };
}) {
  return db.$transaction(async (tx) => {
    let createdUser = null;

    if (data.userData) {
      createdUser = await tx.user.create({
        data: {
          name: data.userData.name,
          email: data.userData.email,
          password: data.userData.password,
          userRoles: { create: { roleId: data.userData.roleId } },
        },
      });
    }

    const employeeCreateData = { ...data.employeeData };
    if (createdUser) {
      employeeCreateData.userId = createdUser.id;
    }

    const createdEmployee = await tx.employee.create({
      data: employeeCreateData,
    });

    return { user: createdUser, employee: createdEmployee };
  });
}

/**
 * Update employee within a transaction.
 */
export async function updateEmployee(
  id: string,
  data: {
    employeeData: any;
    userData?: {
      userId: string;
      email?: string;
      password?: string;
      name?: string;
      roleDefinitionId?: string;
    };
  },
) {
  return db.$transaction(async (tx) => {
    const updatedEmployee = await tx.employee.update({
      where: { id },
      data: data.employeeData,
    });

    if (data.userData) {
      const { userId, roleDefinitionId, ...userUpdateFields } = data.userData;
      const userUpdateData: any = {};

      if (userUpdateFields.email) userUpdateData.email = userUpdateFields.email;
      if (userUpdateFields.password)
        userUpdateData.password = userUpdateFields.password;
      if (userUpdateFields.name) userUpdateData.name = userUpdateFields.name;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      if (roleDefinitionId) {
        const existingRoles = await tx.userRole.findMany({
          where: { userId },
        });
        const targetRole = existingRoles.find(
          (r) => r.roleId === roleDefinitionId,
        );

        await tx.userRole.updateMany({
          where: {
            userId,
            roleId: { not: roleDefinitionId },
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });

        if (targetRole) {
          if (targetRole.deletedAt) {
            await tx.userRole.update({
              where: { id: targetRole.id },
              data: { deletedAt: null },
            });
          }
        } else {
          await tx.userRole.create({
            data: { userId, roleId: roleDefinitionId },
          });
        }
      }
    }

    return updatedEmployee;
  });
}

/**
 * Soft-delete an employee by setting the `deletedAt` timestamp.
 */
export async function softDeleteEmployee(id: string) {
  return db.employee.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
