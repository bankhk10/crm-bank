import { NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/companies";

const companySchema = z.object({
  name: z.string().min(2),
  companyCode: z.string().optional(),
  shortName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
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
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const parseDate = (value: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const fromDate = parseDate(fromParam);
  const toDate = parseDate(toParam);

  const where: Prisma.CompanyWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { shortName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { lte: endOfDay(toDate) } : {}),
    };
  }

  const [total, companies] = await Promise.all([
    db.company.count({ where }),
    db.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return NextResponse.json({ companies, total, page, perPage });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure caller has explicit create permission for companies
  if (!session.user.permissions?.["company.create"]?.allow) {
    return NextResponse.json(
      { error: "Forbidden - missing company.create" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  // debug: log incoming payload to help track 400 validation errors
  // incoming body received (logging removed)
  // sanitize keys in body to handle accidental whitespace or odd chars in keys
  const knownKeys = [
    "name",
    "companyCode",
    "shortName",
    "email",
    "phone",
    "taxId",
    "addressLine",
    "province",
    "district",
    "subdistrict",
    "postalCode",
    "status",
  ];

  const sanitizeKey = (k: string) => k.replace(/[^a-zA-Z]/g, "").toLowerCase();

  // Build a direct map of sanitized-knownKey -> original knownKey to avoid
  // accidental partial matches (e.g. "shortName" matching "name").
  const keyMap = Object.fromEntries(
    knownKeys.map((kk) => [sanitizeKey(kk), kk])
  );

  const normalizedBody: Record<string, unknown> = {};
  if (body && typeof body === "object") {
    const entries = Object.entries(body as Record<string, unknown>);
    for (const [k, v] of entries) {
      const cleaned = sanitizeKey(k);
      const mapped = keyMap[cleaned];
      if (mapped) {
        normalizedBody[mapped] = v;
      } else {
        // keep original key if we couldn't map it
        normalizedBody[k] = v;
      }
    }
  }

  // coerce postalCode to string if it's a number
  if (
    normalizedBody.postalCode !== undefined &&
    typeof normalizedBody.postalCode === "number"
  ) {
    normalizedBody.postalCode = String(normalizedBody.postalCode);
  }
  const parsed = companySchema.safeParse(
    Object.keys(normalizedBody).length ? normalizedBody : body
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const company = await db.company.create({
      data: {
        name: parsed.data.name,
        companyCode: parsed.data.companyCode,
        shortName: parsed.data.shortName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        taxId: parsed.data.taxId,
        addressLine: parsed.data.addressLine,
        province: parsed.data.province,
        district: parsed.data.district,
        subdistrict: parsed.data.subdistrict,
        postalCode: parsed.data.postalCode,
        status: parsed.data.status ?? "ACTIVE",
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Unique constraint failed - provide a helpful message for client
      const target = (err.meta && (err.meta as any).target) || [];
      const fields = Array.isArray(target) ? target.join(", ") : String(target);
      return NextResponse.json(
        { error: `Unique constraint failed on the fields: (${fields})` },
        { status: 409 }
      );
    }

    // Re-throw unknown errors so they surface as 500 for proper logging during development
    throw err;
  }
}
