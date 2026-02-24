"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/modules/rbac";
import {
  createEmployeeUseCase,
  updateEmployeeUseCase,
  getEmployeeDetailUseCase,
  listAllEmployeesUseCase,
} from "../application";
import { softDeleteEmployee } from "../infrastructure/employee.repository";

const resourcePath = "/api/employee";

export async function createEmployeeAction(rawData: unknown) {
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
    const result = await createEmployeeUseCase(rawData);
    if (result.success) {
      revalidatePath("/employee");
    }
    return result;
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

  try {
    const result = await updateEmployeeUseCase(id, rawData);
    if (result.success) {
      revalidatePath("/employee");
      revalidatePath(`/employee/${id}`);
      revalidatePath(`/employee/${id}/edit`);
    }
    return result;
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
    await softDeleteEmployee(id);
    revalidatePath("/employee");
    return { success: true };
  } catch (_err) {
    return { success: false, error: "Failed to delete employee." };
  }
}

export async function getEmployeesAction() {
  const session = await auth();
  if (!session?.user) return { success: false, employees: [] };

  try {
    const result = await listAllEmployeesUseCase();
    return { success: true, employees: result.employees };
  } catch (_err) {
    return { success: false, employees: [] };
  }
}

export async function getEmployeeAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const result = await getEmployeeDetailUseCase(id);
    return result;
  } catch (_err) {
    return { success: false, error: "Failed to fetch" };
  }
}
