import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const roleSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9_\-]+$/),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export async function GET() {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const roles = await db.role.findMany({
    where: { deletedAt: null },
    include: {
      permissions: {
        include: { permission: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const role = await db.role.create({
    data: {
      name: payload.name,
      slug: payload.slug.toLowerCase(),
      description: payload.description,
      isActive: payload.isActive ?? true
    }
  });

  return NextResponse.json(role, { status: 201 });
}
