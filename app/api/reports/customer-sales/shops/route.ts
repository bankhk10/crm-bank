import { NextResponse } from "next/server";
import { fetchCustomerSalesShops } from "@/lib/data/report-customer-sales";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const data = await fetchCustomerSalesShops({ from, to });
  return NextResponse.json(data);
}
