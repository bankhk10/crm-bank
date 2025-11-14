import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "data", "thai-province-data", "province_with_district_and_sub_district.json");
    const raw = await fs.promises.readFile(file, "utf-8");
    const json = JSON.parse(raw);
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
