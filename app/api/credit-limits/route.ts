import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/lib/db";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/modules/rbac";
import { applyDataScope } from "@/lib/data-scope";

const resourcePath = "/api/credit-limits";

const creditLimitSchema = z.object({
  customerId: z.string().min(1),
  limitAmount: z.number().nonnegative(),
  promoAmount: z.number().nonnegative().optional(),
  effectiveDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

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

  const where: Prisma.CreditLimitWhereInput = { deletedAt: null };

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
    ["ACTIVE", "SUSPENDED", "EXPIRED"].includes(statusFilter)
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
  await applyDataScope(where, session, "creditlimit");

  const [total, creditLimits] = await Promise.all([
    db.creditLimit.count({ where }),
    db.creditLimit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        customer: true,
      },
    }),
  ]);

  return NextResponse.json({ creditLimits, total, page, perPage });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = creditLimitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const effectiveDate =
      typeof parsed.data.effectiveDate === "string"
        ? new Date(parsed.data.effectiveDate)
        : parsed.data.effectiveDate;

    const expiryDate = parsed.data.expiryDate
      ? typeof parsed.data.expiryDate === "string"
        ? new Date(parsed.data.expiryDate)
        : parsed.data.expiryDate
      : undefined;

    const limitAmount = parsed.data.limitAmount;
    const promoAmount = parsed.data.promoAmount;

    const creditLimit = await db.creditLimit.create({
      data: {
        customerId: parsed.data.customerId,
        limitAmount,
        promoAmount: promoAmount ?? null,
        usedAmount: 0,
        availableAmount: limitAmount,
        effectiveDate,
        expiryDate,
        notes: parsed.data.notes,
        status: "ACTIVE",
        createdById: session.user.id,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ creditLimit }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaErr = err as Prisma.PrismaClientKnownRequestError;
      if (prismaErr.code === "P2003") {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 400 },
        );
      }
    }

    throw err;
  }
}

