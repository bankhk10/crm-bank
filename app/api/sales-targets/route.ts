import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { salesTargetService } from "@/src/core/sales-targets/sales-target.service";

// GET: Fetch all sales targets for a specific year
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("id") || undefined;
    const fallbackYear = new Date().getFullYear();
    const parsedYear = parseInt(
      searchParams.get("year") || fallbackYear.toString(),
    );
    const year = Number.isNaN(parsedYear) ? fallbackYear : parsedYear;
    const monthParam = searchParams.get("month");
    const employeeId = searchParams.get("employeeId") || undefined;
    const shopId =
      searchParams.get("shopId") || searchParams.get("customerId") || undefined;
    const month =
      monthParam && monthParam !== "all" ? Number(monthParam) : undefined;

    const data = await salesTargetService.getSalesTargets({
      year,
      month,
      employeeId,
      shopId,
      targetId,
    });

    if (targetId && data.detailedTarget) {
      return NextResponse.json({ detailedTarget: data.detailedTarget });
    } else if (targetId && !data.detailedTarget) {
      return NextResponse.json(
        { error: "Sales target not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sales targets:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales targets" },
      { status: 500 },
    );
  }
}

// POST: Create or update sales targets
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.roles?.includes("administrator");
    const hasCreatePermission = session.user.permissionKeys?.includes(
      "sales_target.create",
    );
    const hasEditPermission =
      session.user.permissionKeys?.includes("sales_target.edit");

    if (!isAdmin && !hasCreatePermission && !hasEditPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, targets } = body;

    if (!type || !targets || !Array.isArray(targets)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    let results;

    if (type === "detailed") {
      results = await salesTargetService.saveDetailedTargets(
        targets,
        session.user.id,
        isAdmin || false,
        hasCreatePermission || false,
        hasEditPermission || false,
      );
    } else if (type === "monthly") {
      // Only allow monthly if explicitly asked
      results = await salesTargetService.saveLegacyTargets(
        type,
        targets,
        session.user.id,
        isAdmin || false,
        hasCreatePermission || false,
        hasEditPermission || false,
      );
    } else {
      // Disallow other types
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Error saving sales targets:", error);
    return NextResponse.json(
      { error: "Failed to save sales targets" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a sales target
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.roles?.includes("administrator");
    const hasDeletePermission = session.user.permissionKeys?.includes(
      "sales_target.delete",
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await salesTargetService.deleteSalesTarget(
      id,
      isAdmin || false,
      hasDeletePermission || false,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sales target:", error);
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete sales target" },
      { status: 500 },
    );
  }
}
