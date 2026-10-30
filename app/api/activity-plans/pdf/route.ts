import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { activityPdfService } from "@/modules/activity/application/pdf/activity-pdf.service";
import { findActivityPlanById } from "@/modules/activity/infrastructure/activity-plan.repository";

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
  const disposition = searchParams.get("disposition") === "inline" ? "inline" : "attachment";

  try {
    let filename: string;
    if (mode === "ALL") {
      const targetYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
      const targetMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
      filename = `รายงานสรุปแผนงานประจำเดือน-${targetMonth}-${targetYear + 543}.pdf`;
    } else {
      let planCode = "ActivityPlan";
      if (planId) {
        const plan = await findActivityPlanById(planId);
        planCode = plan?.code || "ActivityPlan";
      }
      filename = `${planCode}${typeCode !== "ALL" ? `-${typeCode}` : ""}.pdf`;
    }

    const pdfBuffer = await activityPdfService.generatePlanPdfBuffer(planId, {
      planId,
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

