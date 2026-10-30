import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { activityPdfService } from "@/modules/activity/application/pdf/activity-pdf.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);

  const mode = (searchParams.get("mode") as "ALL" | "SINGLE") || (id === "all" || id === "monthly" ? "ALL" : "SINGLE");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const employeeId = searchParams.get("employeeId") || undefined;
  const typeCode = searchParams.get("type") || "ALL";
  const includeActual = searchParams.get("includeActual") !== "false";
  const includePhotos = searchParams.get("includePhotos") !== "false";
  const pageBreakPerType = searchParams.get("pageBreakPerType") !== "false";

  try {
    const html = await activityPdfService.generatePlanHtml(id, {
      planId: id !== "all" && id !== "monthly" ? id : undefined,
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
    return NextResponse.json(
      { error: err.message || "Failed to generate plan HTML preview" },
      { status: 500 },
    );
  }
}

