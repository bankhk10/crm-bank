import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/src/infrastructure/database";
import * as StockRepository from "@/modules/products/infrastructure/stock.repository";
import type { LotInfo } from "@/modules/products/types/stock";

interface SuggestedAllocation {
  lotId: string;
  lotNumber: string;
  quantity: number;
}

interface SaleItemLotOptionsExtended {
  saleItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  requiredQuantity: number;
  availableLots: LotInfo[];
  existingAllocations: SuggestedAllocation[];
  suggestedAllocations: SuggestedAllocation[]; // Auto-calculated allocations
}

/**
 * Calculate suggested allocations based on required quantity
 * Uses LOTs with least stock first (ascending order)
 */
function calculateSuggestedAllocations(
  availableLots: LotInfo[],
  requiredQuantity: number,
): SuggestedAllocation[] {
  const allocations: SuggestedAllocation[] = [];
  let remaining = requiredQuantity;

  // LOTs are already sorted by quantity ascending from the repository
  for (const lot of availableLots) {
    if (remaining <= 0) break;

    const allocQty = Math.min(lot.quantity, remaining);
    if (allocQty > 0) {
      allocations.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantity: allocQty,
      });
      remaining -= allocQty;
    }
  }

  return allocations;
}

/**
 * GET /api/sales/[id]/lot-options
 * Get available LOT options for each sale item
 * Returns LOTs sorted by quantity (least first) with auto-suggested allocations
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

    // Get available LOTs for each sale item (sorted by quantity ascending)
    const lotOptions: SaleItemLotOptionsExtended[] = await Promise.all(
      sale.items.map(async (item) => {
        // Use the new function that sorts by quantity ascending
        const availableLots =
          await StockRepository.getAvailableLotsOrderByQuantity(item.productId);

        const lotInfos: LotInfo[] = availableLots.map((lot) => ({
          id: lot.id,
          lotNumber: lot.lotNumber,
          quantity: lot.quantity,
          expiryDate: lot.expiryDate,
          storageLocation: lot.storageLocation,
          productId: lot.productId,
        }));

        // Check if this sale already has LOT allocations
        const existingAllocations: SuggestedAllocation[] =
          item.lotAllocations?.map((la) => ({
            lotId: la.lotId,
            lotNumber: la.lot.lotNumber,
            quantity: la.quantity,
          })) || [];

        // Calculate suggested allocations if no existing allocations
        const suggestedAllocations =
          existingAllocations.length > 0
            ? existingAllocations
            : calculateSuggestedAllocations(lotInfos, item.quantity);

        return {
          saleItemId: item.id,
          productId: item.productId,
          productCode: item.product.productCode,
          productName: item.product.name,
          requiredQuantity: item.quantity,
          availableLots: lotInfos,
          existingAllocations,
          suggestedAllocations,
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
