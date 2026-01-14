import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/src/infrastructure/database";
import { auth } from "@/lib/auth";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/src/core/rbac";

const resourcePath = "/api/temporary-credit-limits";

const temporaryCreditLimitSchema = z.object({
  customerId: z.string().min(1),
  requestedAmount: z.union([
    z.number().positive(),
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("Invalid amount");
      }
      return num;
    }),
  ]),
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
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("perPage") || "12", 10))
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

  console.log("📝 Temporary Credit Request Body:", body);

  const parsed = temporaryCreditLimitSchema.safeParse(body);

  if (!parsed.success) {
    console.error("❌ Validation Error:", parsed.error.flatten());
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const expiryDate =
      typeof parsed.data.expiryDate === "string"
        ? new Date(parsed.data.expiryDate)
        : parsed.data.expiryDate;

    console.log("✅ Validation passed, creating temporary credit limit...");
    console.log("  Customer ID:", parsed.data.customerId);
    console.log("  Amount:", parsed.data.requestedAmount);
    console.log("  Expiry Date:", expiryDate);
    console.log("  Requested By User ID:", session.user.id);

    const temporaryCreditLimit = await db.temporaryCreditLimit.create({
      data: {
        customerId: parsed.data.customerId,
        requestedAmount: parsed.data.requestedAmount,
        expiryDate,
        notes: parsed.data.notes || null,
        status: "PENDING",
        requestedById: session.user.id || null,
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

    console.log("✅ Temporary credit limit created:", temporaryCreditLimit.id);

    return NextResponse.json({ temporaryCreditLimit }, { status: 201 });
  } catch (err) {
    console.error("❌ Error creating temporary credit limit:", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      const target = err.meta?.modelName as string | undefined; // Sometimes comes as modelName, sometimes parsing message is needed
      const message = err.message;

      if (message.includes("TemporaryCreditLimit_requestedById_fkey")) {
        return NextResponse.json(
          {
            error: "Invalid User (Requester) ID. Please try logging in again.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }

    console.error("Full error details:", {
      name: err instanceof Error ? err.name : "Unknown",
      message: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        error: "Failed to create temporary credit limit",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
