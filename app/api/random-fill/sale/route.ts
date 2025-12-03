import { NextResponse } from "next/server";
import generateRandomSale from "@/lib/random-fill/sale";

export async function GET() {
  try {
    const sale = await generateRandomSale();
    return NextResponse.json({ sale });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
