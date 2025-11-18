import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/companies";

const companySchema = z.object({
  name: z.string().min(2),
  shortName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(["PROSPECT", "ACTIVE", "INACTIVE"]).optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companies = await db.company.findMany({
    include: {
      employees: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ companies });
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
  const parsed = companySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const company = await db.company.create({
    data: {
      name: parsed.data.name,
      shortName: parsed.data.shortName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      taxId: parsed.data.taxId,
      addressLine: parsed.data.addressLine,
      province: parsed.data.province,
      district: parsed.data.district,
      subdistrict: parsed.data.subdistrict,
      postalCode: parsed.data.postalCode,
      industry: parsed.data.industry,
      status: parsed.data.status ?? "PROSPECT",
    },
  });

  return NextResponse.json({ company }, { status: 201 });
}
