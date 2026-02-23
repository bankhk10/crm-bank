"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Prisma } from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/src/core/rbac";
import { employeeSchema, employeeUpdateSchema } from "./validations";
import { hash } from "bcryptjs";

const resourcePath = "/api/employee";

export async function createEmployeeAction(rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    // If exact route match fails, check if they have general management permission
    if (!(session.user.permissionKeys ?? []).includes("employee.manage")) {
      return { success: false, error: "Forbidden" };
    }
  }

  const parsed = employeeSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Basic uniqueness checks
  if (data.email) {
    const existingEmp = await db.employee.findUnique({
      where: { email: data.email },
    });
    if (existingEmp) {
      return {
        success: false,
        error: "อีเมลนี้ถูกใช้งานแล้วในระบบพนักงาน",
        issues: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] },
      };
    }

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return {
        success: false,
        error: "อีเมลนี้ถูกใช้งานแล้วในระบบผู้ใช้",
        issues: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] },
      };
    }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      let createdUser = null;

      if (data.email && data.password && data.roleDefinitionId) {
        const hashed = await hash(data.password, 12);

        const userCreateData = {
          name: `${data.prefix ?? ""} ${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          password: hashed,
          userRoles: { create: { roleId: data.roleDefinitionId } },
        };

        createdUser = await tx.user.create({ data: userCreateData });
      }

      // get role definition name
      let roleName = null;
      if (data.roleDefinitionId) {
        const r = await tx.role.findUnique({
          where: { id: data.roleDefinitionId },
        });
        if (r) roleName = r.name;
      }

      const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

      const employeeCreateData: any = {
        name: `${data.prefix ?? ""} ${data.firstName} ${data.lastName}`.trim(),
        email: data.email || undefined,
        prefix: data.prefix || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        employeeCode: data.employeeCode || undefined,
        phone: data.phone || undefined,
        birthDate: !isNaN(birthDate?.getTime() ?? NaN) ? birthDate : undefined,
        addressLine: data.addressLine || undefined,
        province: data.province || undefined,
        district: data.district || undefined,
        subdistrict: data.subdistrict || undefined,
        postalCode: data.postalCode || undefined,
        responsibilityArea: data.responsibilityArea || undefined,
        status: data.status ?? "ACTIVE",
        roleTitle: roleName || undefined,
        positionId: data.position || undefined,
        departmentId: data.department || undefined,
        companyId: data.company || undefined,
        managerId: data.managerId || undefined,
      };

      if (createdUser) {
        employeeCreateData.userId = createdUser.id;
      }

      const createdEmployee = await tx.employee.create({
        data: employeeCreateData,
      });

      return { user: createdUser, employee: createdEmployee };
    });

    revalidatePath("/employee");
    return { success: true, employee: result.employee };
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function updateEmployeeAction(id: string, rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    if (
      !(session.user.permissionKeys ?? []).includes("employee.manage") &&
      !(session.user.permissionKeys ?? []).includes("employee.edit")
    ) {
      return { success: false, error: "Forbidden" };
    }
  }

  const parsed = employeeUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const existingEmployee = await db.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingEmployee) {
      return { success: false, error: "Employee not found" };
    }

    const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

    // get role definition name
    let roleName = null;
    if (data.roleDefinitionId) {
      const r = await db.role.findUnique({
        where: { id: data.roleDefinitionId },
      });
      if (r) roleName = r.name;
    }

    const employeeUpdateData: any = {
      name: `${data.prefix ?? ""} ${data.firstName ?? existingEmployee.firstName ?? ""} ${data.lastName ?? existingEmployee.lastName ?? ""}`.trim(),
      email: data.email ?? undefined,
      prefix: data.prefix ?? undefined,
      firstName: data.firstName ?? undefined,
      lastName: data.lastName ?? undefined,
      employeeCode: data.employeeCode ?? undefined,
      phone: data.phone ?? undefined,
      birthDate:
        birthDate && !isNaN(birthDate.getTime()) ? birthDate : undefined,
      addressLine: data.addressLine ?? undefined,
      province: data.province ?? undefined,
      district: data.district ?? undefined,
      subdistrict: data.subdistrict ?? undefined,
      postalCode: data.postalCode ?? undefined,
      responsibilityArea: data.responsibilityArea ?? undefined,
      status: data.status ?? undefined,
    };

    if (roleName) employeeUpdateData.roleTitle = roleName;

    // Convert empty strings to null for relations
    employeeUpdateData.positionId = data.position === "" ? null : data.position;
    employeeUpdateData.departmentId =
      data.department === "" ? null : data.department;
    employeeUpdateData.companyId = data.company === "" ? null : data.company;
    employeeUpdateData.managerId =
      data.managerId === "" ? null : data.managerId;

    await db.$transaction(async (tx) => {
      // Update employee
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: employeeUpdateData,
      });

      // Update linked user if exists
      if (existingEmployee.user) {
        const userId = existingEmployee.user.id;
        const userUpdateData: any = {};

        if (data.email) userUpdateData.email = data.email;
        if (data.password)
          userUpdateData.password = await hash(data.password, 12);

        userUpdateData.name = employeeUpdateData.name;

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: userId },
            data: userUpdateData,
          });
        }

        if (data.roleDefinitionId) {
          // Soft delete old roles and create/restore new one
          const existingRoles = await tx.userRole.findMany({
            where: { userId },
          });
          const targetRole = existingRoles.find(
            (r) => r.roleId === data.roleDefinitionId,
          );

          await tx.userRole.updateMany({
            where: {
              userId,
              roleId: { not: data.roleDefinitionId },
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
              data: { userId, roleId: data.roleDefinitionId },
            });
          }
        }
      }
    });

    revalidatePath("/employee");
    revalidatePath(`/employee/${id}`);
    revalidatePath(`/employee/${id}/edit`);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? "An unexpected error occurred.",
    };
  }
}

export async function deleteEmployeeAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    if (!(session.user.permissionKeys ?? []).includes("employee.manage")) {
      return { success: false, error: "Forbidden" };
    }
  }

  try {
    await db.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/employee");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to delete employee." };
  }
}

export async function getEmployeesAction() {
  const session = await auth();
  if (!session?.user) return { success: false, employees: [] };

  try {
    const employees = await db.employee.findMany({
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
    return { success: true, employees };
  } catch (err) {
    return { success: false, employees: [] };
  }
}

export async function getEmployeeAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const { getEmployee } = await import("./queries");
    const employee = await getEmployee(id);
    if (!employee) return { success: false, error: "Not found" };
    return { success: true, employee };
  } catch (err) {
    return { success: false, error: "Failed to fetch" };
  }
}
