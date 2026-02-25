import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/lib/db";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/modules/rbac";
import { applyDataScope } from "@/lib/data-scope";

const resourcePath = "/api/temporary-credit-limits";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10)),
  );
  const q = (url.searchParams.get("q") || "").trim();
  const customerId = url.searchParams.get("customerId");
  const statusFilter = url.searchParams.get("status");
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const parseDate = (value: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const fromDate = parseDate(fromParam);
  const toDate = parseDate(toParam);

  const where: Prisma.TemporaryCreditLimitWhereInput = { deletedAt: null };

  if (customerId) {
    where.customerId = customerId;
  }

  if (q) {
    where.customer = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { customerCode: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  if (
    statusFilter &&
    ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)
  ) {
    where.status = statusFilter as any;
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

  // Permission-based data scope filtering
  await applyDataScope(where, session, "temporary_creditlimit");

  const [total, temporaryCreditLimits] = await Promise.all([
    db.temporaryCreditLimit.count({ where }),
    db.temporaryCreditLimit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
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
    }),
  ]);

  return NextResponse.json({ temporaryCreditLimits, total, page, perPage });
}

