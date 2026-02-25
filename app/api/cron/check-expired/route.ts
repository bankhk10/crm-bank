import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { releaseStockUseCase as releaseStock } from "@/modules/products/application";

export const dynamic = "force-dynamic";

// GET /api/cron/check-expired
// Checks for sales where delivery date is unknown and requested date has passed.
export async function GET() {
  try {
    const now = new Date();

    const expiredSales = await prisma.sale.findMany({
      where: {
        status: {
          in: ["APPROVED", "AWAITING_DELIVERY", "AWAITING_PAYMENT"],
        },
        deliveryDate: null, // Unknown delivery date
        requestedDeliveryDate: {
          lt: now, // Passed due date
        },
        deletedAt: null,
      },
    });

    console.log(`Found ${expiredSales.length} expired sales to process.`);

    const results = [];

    for (const sale of expiredSales) {
      try {
        await prisma.$transaction(async (tx) => {
          // Release stock
          await releaseStock(sale.id, tx);

          // Return credit limit if applicable
          if (sale.paymentTerm !== "PREPAID") {
            const creditLimit = await tx.creditLimit.findFirst({
              where: {
                customerId: sale.customerId,
                status: "ACTIVE",
                deletedAt: null,
              },
            });

            if (creditLimit) {
              await tx.creditLimit.update({
                where: { id: creditLimit.id },
                data: {
                  usedAmount: { decrement: sale.totalAmount },
                  availableAmount: { increment: sale.totalAmount },
                },
              });
            }
          }

          // Update status to EXPIRED
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              status: "EXPIRED",
              statusHistory: {
                create: {
                  status: "EXPIRED",
                  notes:
                    "System expired: Delivery date not set by requested date.",
                  changedById: "system-cron", // Indicate system change
                },
              },
            },
          });
        });

        results.push({ id: sale.id, status: "success" });
      } catch (err: any) {
        console.error(`Error processing expired sale ${sale.id}:`, err);
        results.push({ id: sale.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
