import { NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/modules/rbac";

const resourcePath = "/api/products";

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Get all distinct product names from products
        const products = await db.product.findMany({
            where: {
                deletedAt: null,
                status: "ACTIVE",
            },
            select: {
                name: true,
            },
            distinct: ["name"],
            orderBy: {
                name: "asc",
            },
        });

        const productNames = products
            .map((p) => p.name)
            .filter((name): name is string => name !== null && name !== "");

        return NextResponse.json({ productGroups: productNames });
    } catch (err) {
        console.error("Error fetching product names:", err);
        return NextResponse.json(
            { error: "Failed to fetch product names" },
            { status: 500 }
        );
    }
}

