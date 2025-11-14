import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [departments, positions, roles] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.position.findMany({ orderBy: { name: "asc" } }),
    db.role.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    })
  ]);

  return NextResponse.json({ departments, positions, roles });
}
