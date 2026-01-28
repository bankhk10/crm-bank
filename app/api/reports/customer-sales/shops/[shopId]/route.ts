import { NextResponse } from "next/server";
import { fetchCustomerSalesShopDetail } from "@/lib/data/report-customer-sales";

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } },
) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  const data = await fetchCustomerSalesShopDetail(params.shopId, {
    from,
    to,
    page,
    pageSize,
  });

  if (!data) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
