import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/credit-limits";

const creditLimitUpdateSchema = z.object({
  limitAmount: z.number().positive().optional(),
  promoAmount: z.number().nonnegative().optional(),
  usedAmount: z.number().optional(),
  effectiveDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED"]).optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
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

export async function PUT(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["creditlimit.edit"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing creditlimit.edit" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = creditLimitUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updateData: any = { ...parsed.data };

  if (parsed.data.effectiveDate) {
    updateData.effectiveDate = typeof parsed.data.effectiveDate === "string"
      ? new Date(parsed.data.effectiveDate)
      : parsed.data.effectiveDate;
  }

  if (parsed.data.expiryDate) {
    updateData.expiryDate = typeof parsed.data.expiryDate === "string"
      ? new Date(parsed.data.expiryDate)
      : parsed.data.expiryDate;
  }

  // Recalculate available amount if limit or used amount changed
  if (parsed.data.limitAmount !== undefined || parsed.data.usedAmount !== undefined) {
    const current = await db.creditLimit.findUnique({
      where: { id: params.creditLimitId },
      select: { limitAmount: true, usedAmount: true },
    });

    if (current) {
      const newLimit = parsed.data.limitAmount ?? Number(current.limitAmount);
      const newUsed = parsed.data.usedAmount ?? Number(current.usedAmount);
      updateData.availableAmount = newLimit - newUsed;
    }
  }

  const creditLimit = await db.creditLimit.update({
    where: { id: params.creditLimitId },
    data: updateData,
    include: {
      customer: true,
    },
  });

  return NextResponse.json({ creditLimit });
}

export async function DELETE(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["creditlimit.delete"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing creditlimit.delete" }, { status: 403 });
  }

  const updated = await db.creditLimit.update({
    where: { id: params.creditLimitId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true, creditLimit: updated });
}
