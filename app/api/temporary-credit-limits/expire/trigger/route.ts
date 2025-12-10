import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/lib/rbac";
import { temporaryCreditExpiryService } from "@/lib/services/temporary-credit-expiry.service";

const resourcePath = "/api/temporary-credit-limits";

/**
 * POST /api/temporary-credit-limits/expire/trigger
 * Manually trigger the expiry process
 */
export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorized(resourcePath, session.user.permissions)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user has admin permission
    if (!session.user.permissions?.["temporary_creditlimit.approve"]?.allow) {
        return NextResponse.json(
            { error: "Forbidden - requires temporary_creditlimit.approve permission" },
            { status: 403 }
        );
    }

    try {
        // Trigger the service to run now
        await temporaryCreditExpiryService.runNow();

        return NextResponse.json({
            message: "Expiry process triggered successfully",
            triggeredBy: session.user.name,
            triggeredAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error triggering expiry process:", error);
        return NextResponse.json(
            {
                error: "Failed to trigger expiry process",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
