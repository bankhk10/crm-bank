import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";
import { StockRepository } from "@/src/core/stock";
import type { SaleItemLotOptions, LotInfo } from "@/src/core/stock/stock.types";

/**
 * GET /api/sales/[id]/lot-options
 * Get available LOT options for each sale item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sale with items and product info
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
              },
            },
            lotAllocations: {
              include: {
                lot: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Get available LOTs for each sale item
    const lotOptions: SaleItemLotOptions[] = await Promise.all(
      sale.items.map(async (item) => {
        const availableLots = await StockRepository.getAvailableLots(
          item.productId,
        );

        const lotInfos: LotInfo[] = availableLots.map((lot) => ({
          id: lot.id,
          lotNumber: lot.lotNumber,
          quantity: lot.quantity,
          expiryDate: lot.expiryDate,
          storageLocation: lot.storageLocation,
          productId: lot.productId,
        }));

        // Check if this sale already has LOT allocations
        const existingAllocations =
          item.lotAllocations?.map((la) => ({
            lotId: la.lotId,
            lotNumber: la.lot.lotNumber,
            quantity: la.quantity,
          })) || [];

        return {
          saleItemId: item.id,
          productId: item.productId,
          productCode: item.product.productCode,
          productName: item.product.name,
          requiredQuantity: item.quantity,
          availableLots: lotInfos,
          existingAllocations, // Include existing allocations if any
        };
      }),
    );

    return NextResponse.json({
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      hasExistingAllocations: sale.items.some(
        (item) => item.lotAllocations && item.lotAllocations.length > 0,
      ),
      items: lotOptions,
    });
  } catch (error) {
    console.error("Error fetching lot options:", error);
    return NextResponse.json(
      { error: "Failed to fetch lot options" },
      { status: 500 },
    );
  }
}
