import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/temporary-credit-limits";

const approvalSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().optional(),
});

export async function POST(request: Request, context: any) {
  const params = typeof context?.params?.then === "function" ? await context.params : context.params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["temporary_creditlimit.approve"]?.allow) {
    return NextResponse.json({ error: "Forbidden - missing temporary_creditlimit.approve" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = approvalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await db.temporaryCreditLimit.findFirst({
    where: { id: params.temporaryCreditLimitId, deletedAt: null },
    include: {
      customer: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending requests can be processed" }, { status: 400 });
  }

  if (!parsed.data.approve && !parsed.data.rejectionReason) {
    return NextResponse.json({ error: "Rejection reason is required when rejecting" }, { status: 400 });
  }

  const now = new Date();

  if (parsed.data.approve) {
    // Approve - create permanent credit limit and update status
    const result = await db.$transaction(async (tx) => {
      // Create permanent credit limit
      const creditLimit = await tx.creditLimit.create({
        data: {
          customerId: existing.customerId,
          limitAmount: existing.requestedAmount,
          usedAmount: 0,
          availableAmount: existing.requestedAmount,
          effectiveDate: now,
          expiryDate: existing.expiryDate,
          notes: `Temporary credit limit approved. Original notes: ${existing.notes || 'N/A'}`,
          status: "ACTIVE",
          approvedBy: session.user.id,
          approvedAt: now,
          createdById: existing.requestedById || session.user.id,
        },
      });

      // Update temporary credit limit status
      const updatedTemp = await tx.temporaryCreditLimit.update({
        where: { id: params.temporaryCreditLimitId },
        data: {
          status: "APPROVED",
          approvedById: session.user.id,
          approvedAt: now,
        },
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

      return { temporaryCreditLimit: updatedTemp, creditLimit };
    });

    return NextResponse.json(result);
  } else {
    // Reject
    const temporaryCreditLimit = await db.temporaryCreditLimit.update({
      where: { id: params.temporaryCreditLimitId },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.rejectionReason,
        approvedById: session.user.id,
        approvedAt: now,
      },
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

    return NextResponse.json({ temporaryCreditLimit });
  }
}
