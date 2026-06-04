"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import {
  createEmployeeUseCase,
  updateEmployeeUseCase,
  getEmployeeDetailUseCase,
  listAllEmployeesUseCase,
  listEmployeesUseCase,
} from "../application";
import { softDeleteEmployee, type ListEmployeesParams } from "../infrastructure/employee.repository";

export async function createEmployeeAction(rawData: unknown) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!(session.user.permissionKeys ?? []).includes("employee.create")) {
    return { success: false, error: "Forbidden" };
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

  if (!(session.user.permissionKeys ?? []).includes("employee.edit")) {
    return { success: false, error: "Forbidden" };
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

  if (!(session.user.permissionKeys ?? []).includes("employee.delete")) {
    return { success: false, error: "Forbidden" };
  }

  try {
    await softDeleteEmployee(id);
    revalidatePath("/employee");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete employee." };
  }
}

export async function getEmployeesAction(params: ListEmployeesParams = {}) {
  const session = await auth();
  if (!session?.user) return { success: false, employees: [], total: 0 };

  try {
    const result = await listEmployeesUseCase(params);
    return {
      success: true,
      employees: JSON.parse(JSON.stringify(result.employees)),
      total: result.total,
    };
  } catch {
    return { success: false, employees: [], total: 0 };
  }
}

export async function getEmployeeAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  try {
    const result = await getEmployeeDetailUseCase(id);
    return result;
  } catch {
    return { success: false, error: "Failed to fetch" };
  }
}

export async function getAllEmployeesAction() {
  const session = await auth();
  if (!session?.user) return { success: false, employees: [] };

  try {
    const result = await listAllEmployeesUseCase();
    return {
      success: true,
      employees: JSON.parse(JSON.stringify(result.employees)),
    };
  } catch {
    return { success: false, employees: [] };
  }
}

