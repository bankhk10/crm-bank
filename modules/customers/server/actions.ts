"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { applyDataScope } from "@/lib/data-scope";
import {
  getCustomersUseCase,
  getCustomerDetailUseCase,
  createCustomerUseCase,
  updateCustomerUseCase,
  deleteCustomerUseCase,
} from "../application";
import { auditLogger, generateRequestId } from "@/lib/logger";

const resourcePath = "/api/customers";

export async function getCustomersAction(params: any) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    throw new Error("Forbidden");
  }

  const {
    page = 1,
    perPage = 12,
    q,
    typeFilter,
    statusFilter,
    from,
    to,
    parentDealerId,
  } = params;

  // Permission-based data scope filtering
  const scopedWhere = await applyDataScope(
    { deletedAt: null },
    session,
    "customer",
  );

  const result = await getCustomersUseCase({
    page,
    perPage,
    q,
    typeFilter,
    statusFilter,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    parentDealerId,
    scopedWhere,
  });

  // Serialize to convert Prisma Decimal/Date objects to plain values
  return JSON.parse(JSON.stringify(result));
}

export async function getCustomerDetailAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    throw new Error("Forbidden");
  }

  const customer = await getCustomerDetailUseCase(id);
  if (!customer) {
    throw new Error("Not found");
  }

  // Serialize to convert Prisma Decimal/Date objects to plain values
  return JSON.parse(JSON.stringify(customer));
}

export async function createCustomerAction(payload: any) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  const customerType = payload?.customerType;
  if (customerType) {
    const typePermissionKey = `customer.create.${customerType.toLowerCase()}`;
    if (!(session.user.permissionKeys ?? []).includes(typePermissionKey)) {
      return {
        success: false,
        error: `Forbidden - missing ${typePermissionKey}`,
      };
    }
  }

  try {
    const customer = await createCustomerUseCase(payload, session.user.id);

    // revalidate
    revalidatePath("/customers");
    return { success: true, data: customer };
  } catch (error: any) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.issues) {
        return { success: false, error: parsed.message, issues: parsed.issues };
      }
    } catch {
      // not JSON
    }
    return { success: false, error: error.message || String(error) };
  }
}

export async function updateCustomerAction(id: string, payload: any) {
  const startTime = Date.now();
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  const existingCustomer = await getCustomerDetailUseCase(id);
  if (!existingCustomer) {
    return { success: false, error: "Not found" };
  }

  const customerType = existingCustomer.customerType || payload.customerType || 'DEALER';
  const typePermissionKey = `customer.edit.${customerType.toLowerCase()}`;
  if (!(session.user.permissionKeys ?? []).includes(typePermissionKey)) {
    return { success: false, error: `Forbidden - missing ${typePermissionKey}` };
  }

  try {
    const customer = await updateCustomerUseCase(id, payload);

    const logContext = {
      requestId: generateRequestId(),
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      userName: session.user.name ?? undefined,
      endpoint: `/api/customers/${id}`,
      method: "PUT",
    };

    const duration = Date.now() - startTime;
    await auditLogger.logUpdate(
      "Customer",
      id,
      {
        customerCode: existingCustomer.customerCode,
        name: existingCustomer.name,
        customerType: existingCustomer.customerType,
        status: existingCustomer.status,
        phone: existingCustomer.phone,
        email: existingCustomer.email,
      },
      {
        customerCode: customer.customerCode,
        name: customer.name,
        customerType: customer.customerType,
        status: customer.status,
        phone: customer.phone,
        email: customer.email,
      },
      logContext,
      {
        entityName: customer.name,
        module: "customers",
        duration,
      },
    );

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { success: true, data: customer };
  } catch (error: any) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.issues) {
        return { success: false, error: parsed.message, issues: parsed.issues };
      }
    } catch {
      // not JSON
    }
    return { success: false, error: error.message || String(error) };
  }
}

export async function deleteCustomerAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const existingCustomer = await getCustomerDetailUseCase(id);
    if (!existingCustomer) {
      return { success: false, error: "Not found" };
    }

    const customerType = existingCustomer.customerType || 'DEALER';
    const typePermissionKey = `customer.delete.${customerType.toLowerCase()}`;
    if (!(session.user.permissionKeys ?? []).includes(typePermissionKey)) {
      return { success: false, error: `Forbidden - missing ${typePermissionKey}` };
    }
    const updated = await deleteCustomerUseCase(id);
    revalidatePath("/customers");
    return { success: true, customer: updated };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

