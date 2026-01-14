import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/src/infrastructure/database";
import { isAuthorized } from "@/src/core/rbac";

const resourcePath = "/api/products";

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorized(resourcePath, session.user.permissions)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Get all distinct brands from products
        const products = await db.product.findMany({
            where: {
                deletedAt: null,
                brand: {
                    not: null,
                },
            },
            select: {
                brand: true,
            },
            distinct: ["brand"],
            orderBy: {
                brand: "asc",
            },
        });

        const brands = products
            .map((p) => p.brand)
            .filter((b): b is string => b !== null && b !== "");

        return NextResponse.json({ brands });
    } catch (err) {
        console.error("Error fetching brands:", err);
        return NextResponse.json(
            { error: "Failed to fetch brands" },
            { status: 500 }
        );
    }
}
