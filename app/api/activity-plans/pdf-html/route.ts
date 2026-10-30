import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { activityPdfService } from "@/modules/activity/application/pdf/activity-pdf.service";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const planId = searchParams.get("planId") || undefined;
  const mode = (searchParams.get("mode") as "ALL" | "SINGLE") || "ALL";
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const employeeId = searchParams.get("employeeId") || undefined;
  const typeCode = searchParams.get("type") || "ALL";
  const includeActual = searchParams.get("includeActual") !== "false";
  const includePhotos = searchParams.get("includePhotos") !== "false";
  const pageBreakPerType = searchParams.get("pageBreakPerType") !== "false";

  try {
    const html = await activityPdfService.generatePlanHtml(planId, {
      planId,
      mode,
      month: monthParam ? parseInt(monthParam, 10) : undefined,
      year: yearParam ? parseInt(yearParam, 10) : undefined,
      employeeId,
      typeCode: typeCode === "ALL" ? undefined : typeCode,
      includeActual,
      includePhotos,
      pageBreakPerType,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    console.error("PDF HTML preview generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate plan HTML preview" },
      { status: 500 },
    );
  }
}

