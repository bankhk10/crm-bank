import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { activityPdfService } from "@/modules/activity/application/pdf/activity-pdf.service";
import { findActivityPlanById } from "@/modules/activity/infrastructure/activity-plan.repository";

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
  const disposition = searchParams.get("disposition") === "inline" ? "inline" : "attachment";

  try {
    let filename: string;
    if (mode === "ALL") {
      const targetYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
      const targetMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
      filename = `รายงานสรุปแผนงานประจำเดือน-${targetMonth}-${targetYear + 543}.pdf`;
    } else {
      const plan = await findActivityPlanById(id);
      const planCode = plan?.code || "ActivityPlan";
      filename = `${planCode}${typeCode !== "ALL" ? `-${typeCode}` : ""}.pdf`;
    }

    const pdfBuffer = await activityPdfService.generatePlanPdfBuffer(id, {
      planId: id !== "all" && id !== "monthly" ? id : undefined,
      mode,
      month: monthParam ? parseInt(monthParam, 10) : undefined,
      year: yearParam ? parseInt(yearParam, 10) : undefined,
      employeeId,
      typeCode: typeCode === "ALL" ? undefined : typeCode,
      includeActual,
      includePhotos,
      pageBreakPerType,
      disposition,
    });

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate PDF" },
      { status: 500 },
    );
  }
}

