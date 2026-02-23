import { NextResponse } from "next/server";
import { guardPermission } from "@/lib/api-guard";
import { getRBACSummaryUseCase } from "@/modules/rbac/application";

export async function GET() {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const data = await getRBACSummaryUseCase();
  return NextResponse.json(data);
}
