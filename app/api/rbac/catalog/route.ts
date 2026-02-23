import { NextResponse } from "next/server";
import { getRBACCatalogUseCase } from "@/modules/rbac/application";

export async function GET() {
  const data = await getRBACCatalogUseCase();
  return NextResponse.json(data);
}
