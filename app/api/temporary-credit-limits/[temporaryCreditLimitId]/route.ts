import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/temporary-credit-limits";

const temporaryCreditLimitUpdateSchema = z.object({
  requestedAmount: z.number().positive().optional(),
  expiryDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

const approvalSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().optional(),
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

  const temporaryCreditLimit = await db.temporaryCreditLimit.findFirst({
    where: { id: params.temporaryCreditLimitId, deletedAt: null },
    include: {
      customer: true,
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!temporaryCreditLimit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ temporaryCreditLimit });
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

  if (!session.user.permissions?.["temporary_creditlimit.edit"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing temporary_creditlimit.edit" }, { status: 403 });
  }

  // Check if already approved - cannot edit if approved
  const existing = await db.temporaryCreditLimit.findFirst({
    where: { id: params.temporaryCreditLimitId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "APPROVED") {
    return NextResponse.json({ error: "Cannot edit approved temporary credit limit" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = temporaryCreditLimitUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updateData: any = { ...parsed.data };

  if (parsed.data.expiryDate) {
    updateData.expiryDate = typeof parsed.data.expiryDate === "string"
      ? new Date(parsed.data.expiryDate)
      : parsed.data.expiryDate;
  }

  // If this record was previously rejected, sending an edit should return it to pending
  if (existing.status === "REJECTED") {
    updateData.status = "PENDING";
    updateData.rejectionReason = null;
    updateData.approvedById = null;
    updateData.approvedAt = null;
  }

  const temporaryCreditLimit = await db.temporaryCreditLimit.update({
    where: { id: params.temporaryCreditLimitId },
    data: updateData,
    include: {
      customer: true,
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ temporaryCreditLimit });
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

  if (!session.user.permissions?.["temporary_creditlimit.delete"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing temporary_creditlimit.delete" }, { status: 403 });
  }

  // Check if already approved - cannot delete if approved
  const existing = await db.temporaryCreditLimit.findFirst({
    where: { id: params.temporaryCreditLimitId, deletedAt: null },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status === "APPROVED") {
    return NextResponse.json({ error: "Cannot delete approved temporary credit limit" }, { status: 403 });
  }

  const updated = await db.temporaryCreditLimit.update({
    where: { id: params.temporaryCreditLimitId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true, temporaryCreditLimit: updated });
}
