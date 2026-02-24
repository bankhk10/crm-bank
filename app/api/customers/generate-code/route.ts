import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/modules/rbac";

const resourcePath = "/api/customers";

/**
 * Generate customer code based on customer type and current date
 * Format: {PREFIX}{YY}{MM}{NNNN}
 * - PREFIX: F (FARMER), B (BROKER), D (DEALER), S (SUBDEALER)
 * - YY: Last 2 digits of Buddhist year (e.g., 69 for 2569)
 * - MM: Month (01-12)
 * - NNNN: Running number (0001-9999)
 * 
 * Example: F6902001 (Farmer, February 2569, 1st customer)
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const customerType = url.searchParams.get("type");

  if (!customerType || !["DEALER", "SUBDEALER", "FARMER", "BROKER"].includes(customerType)) {
    return NextResponse.json(
      { error: "Invalid customer type. Must be DEALER, SUBDEALER, FARMER, or BROKER" },
      { status: 400 }
    );
  }

  try {
    // Get current date in Thailand timezone
    const now = new Date();
    const thaiDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    
    // Convert to Buddhist year (add 543 years)
    const buddhistYear = thaiDate.getFullYear() + 543;
    const yearSuffix = String(buddhistYear).slice(-2); // Last 2 digits
    const month = String(thaiDate.getMonth() + 1).padStart(2, "0");

    // Determine prefix based on customer type
    const prefixMap: Record<string, string> = {
      FARMER: "F",
      BROKER: "B",
      DEALER: "D",
      SUBDEALER: "S",
    };
    const prefix = prefixMap[customerType];

    // Generate pattern for current month
    const pattern = `${prefix}${yearSuffix}${month}`;

    // Find the highest existing customer code for this pattern
    const existingCustomers = await db.customer.findMany({
      where: {
        customerCode: {
          startsWith: pattern,
        },
        deletedAt: null,
      },
      select: {
        customerCode: true,
      },
      orderBy: {
        customerCode: "desc",
      },
      take: 1,
    });

    let runningNumber = 1;
   

    if (existingCustomers.length > 0) {
      const lastCode = existingCustomers[0].customerCode;
      // Extract the running number from the last code
      const lastRunningNumber = parseInt(lastCode.slice(-4), 10);
      if (!isNaN(lastRunningNumber)) {
        runningNumber = lastRunningNumber + 1;
      }
    }

    // Check if we've exceeded the maximum running number
    if (runningNumber > 9999) {
      return NextResponse.json(
        { error: "Maximum customer codes reached for this month" },
        { status: 400 }
      );
    }

    // Format the running number with leading zeros
    const runningNumberStr = String(runningNumber).padStart(3, "0");
    const customerCode = `${pattern}${runningNumberStr}`;

    return NextResponse.json({ customerCode });
  } catch (error) {
    console.error("[api/customers/generate-code] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
