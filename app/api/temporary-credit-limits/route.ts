import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/temporary-credit-limits";

const temporaryCreditLimitSchema = z.object({
  customerId: z.string().min(1),
  requestedAmount: z.number().positive(),
  expiryDate: z.string().or(z.date()),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10)));
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

  if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
    where.status = statusFilter as any;
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

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

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["temporary_creditlimit.create"]?.allow) {
    return NextResponse.json(
      { error: "Forbidden - missing temporary_creditlimit.create" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = temporaryCreditLimitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const expiryDate = typeof parsed.data.expiryDate === "string" 
      ? new Date(parsed.data.expiryDate) 
      : parsed.data.expiryDate;

    const temporaryCreditLimit = await db.temporaryCreditLimit.create({
      data: {
        customerId: parsed.data.customerId,
        requestedAmount: parsed.data.requestedAmount,
        expiryDate,
        notes: parsed.data.notes,
        status: "PENDING",
        requestedById: session.user.id,
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
      },
    });

    return NextResponse.json({ temporaryCreditLimit }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }

    throw err;
  }
}
