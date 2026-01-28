import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";
import {
  createApiContext,
  createApiLogger,
  logUpdate,
  logDelete,
} from "@/lib/logger";

const resourcePath = "/api/credit-limits";

const creditLimitUpdateSchema = z.object({
  limitAmount: z.number().nonnegative().optional(),
  promoAmount: z.number().nonnegative().optional(),
  usedAmount: z.number().optional(),
  effectiveDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ creditLimitId: string }> }
) {
  const params = await context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creditLimit = await db.creditLimit.findFirst({
    where: { id: params.creditLimitId, deletedAt: null },
    include: {
      customer: true,
    },
  });

  if (!creditLimit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ creditLimit });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ creditLimitId: string }> }
) {
  const params = await context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(session.user.permissionKeys ?? []).includes("creditlimit.edit")) {
    return NextResponse.json(
      { error: "Forbidden - missing creditlimit.edit" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = creditLimitUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Get existing for audit log
  const existing = await db.creditLimit.findUnique({
    where: { id: params.creditLimitId },
    include: { customer: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.effectiveDate) {
    updateData.effectiveDate =
      typeof parsed.data.effectiveDate === "string"
        ? new Date(parsed.data.effectiveDate)
        : parsed.data.effectiveDate;
  }

  if (parsed.data.expiryDate) {
    updateData.expiryDate =
      typeof parsed.data.expiryDate === "string"
        ? new Date(parsed.data.expiryDate)
        : parsed.data.expiryDate;
  }

  // Recalculate available amount if limit or used amount changed
  if (
    parsed.data.limitAmount !== undefined ||
    parsed.data.usedAmount !== undefined
  ) {
    const newLimit = parsed.data.limitAmount ?? Number(existing.limitAmount);
    const newUsed = parsed.data.usedAmount ?? Number(existing.usedAmount);
    updateData.availableAmount = newLimit - newUsed;
  }

  const creditLimit = await db.creditLimit.update({
    where: { id: params.creditLimitId },
    data: updateData,
    include: {
      customer: true,
    },
  });

  // Log audit event (UPDATE)
  const logContext = createApiContext(request, session.user);
  const reqLogger = createApiLogger(logContext);
  await logUpdate(
    "CreditLimit",
    params.creditLimitId,
    {
      limitAmount: existing.limitAmount?.toString(),
      usedAmount: existing.usedAmount?.toString(),
      availableAmount: existing.availableAmount?.toString(),
      status: existing.status,
      customerName: existing.customer?.name,
    },
    {
      limitAmount: creditLimit.limitAmount?.toString(),
      usedAmount: creditLimit.usedAmount?.toString(),
      availableAmount: creditLimit.availableAmount?.toString(),
      status: creditLimit.status,
      customerName: creditLimit.customer?.name,
    },
    logContext,
    {
      entityName: `Credit Limit - ${creditLimit.customer?.name}`,
      module: "credit-limits",
    }
  );

  reqLogger.info("Credit limit updated successfully", {
    module: "credit-limits",
    metadata: {
      creditLimitId: params.creditLimitId,
      customerId: creditLimit.customerId,
    },
  });

  return NextResponse.json({ creditLimit });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ creditLimitId: string }> }
) {
  const params = await context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(session.user.permissionKeys ?? []).includes("creditlimit.delete")) {
    return NextResponse.json(
      { error: "Forbidden - missing creditlimit.delete" },
      { status: 403 }
    );
  }

  // Get existing for audit log
  const existing = await db.creditLimit.findUnique({
    where: { id: params.creditLimitId },
    include: { customer: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.creditLimit.update({
    where: { id: params.creditLimitId },
    data: { deletedAt: new Date() },
  });

  // Log audit event (DELETE)
  const logContext = createApiContext(request, session.user);
  const reqLogger = createApiLogger(logContext);
  await logDelete(
    "CreditLimit",
    params.creditLimitId,
    {
      limitAmount: existing.limitAmount?.toString(),
      usedAmount: existing.usedAmount?.toString(),
      status: existing.status,
      customerName: existing.customer?.name,
    },
    logContext,
    {
      entityName: `Credit Limit - ${existing.customer?.name}`,
      module: "credit-limits",
    }
  );

  reqLogger.info("Credit limit deleted", {
    module: "credit-limits",
    metadata: {
      creditLimitId: params.creditLimitId,
      customerId: existing.customerId,
    },
  });

  return NextResponse.json({ success: true, creditLimit: updated });
}
