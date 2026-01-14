import { NextRequest, NextResponse } from "next/server";
import { checkExpiredOrders, checkOverdueOrders } from "@/src/core/sales";

/**
 * API Route for Order Expiry Cron Job
 *
 * This endpoint should be called periodically (e.g., every hour) by a scheduler
 * to check for expired and overdue orders.
 *
 * Usage:
 * - GET /api/cron/order-expiry - Check both expired and overdue orders
 * - GET /api/cron/order-expiry?type=expired - Check only expired orders
 * - GET /api/cron/order-expiry?type=overdue - Check only overdue orders
 *
 * Security: This endpoint should be protected in production
 * (e.g., with a secret header or IP whitelist)
 */

// Optional: Add a secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Security check (optional, but recommended for production)
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  const results: {
    expired?: { processed: number; errors: string[] };
    overdue?: { processed: number; errors: string[] };
    timestamp: string;
  } = {
    timestamp: new Date().toISOString(),
  };

  try {
    // Check expired orders (no delivery date after 3 days)
    if (!type || type === "expired") {
      console.log("Checking for expired orders...");
      results.expired = await checkExpiredOrders();
    }

    // Check overdue orders (delivery date updated > 3 times and past due)
    if (!type || type === "overdue") {
      console.log("Checking for overdue orders...");
      results.overdue = await checkOverdueOrders();
    }

    const totalProcessed =
      (results.expired?.processed || 0) + (results.overdue?.processed || 0);
    const totalErrors =
      (results.expired?.errors.length || 0) +
      (results.overdue?.errors.length || 0);

    console.log(
      `Order expiry check completed: ${totalProcessed} processed, ${totalErrors} errors`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${totalProcessed} orders`,
      ...results,
    });
  } catch (error) {
    console.error("Error in order expiry cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST method for external cron services that prefer POST
export async function POST(request: NextRequest) {
  return GET(request);
}
