import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { db as prisma } from "@/lib/db";
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
 * Uses LOTs with oldest creation date first (ascending order)
 */
function calculateSuggestedAllocations(
  availableLots: LotInfo[],
  requiredQuantity: number,
): SuggestedAllocation[] {
  const allocations: SuggestedAllocation[] = [];
  let remaining = requiredQuantity;

  // LOTs are already sorted by creation date ascending from the repository
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
 * Returns LOTs sorted by date (oldest first) with auto-suggested allocations
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

    // Get unique product IDs to fetch lots once per product
    const uniqueProductIds = [...new Set(sale.items.map((item) => item.productId))];
    const lotsByProduct = new Map<string, LotInfo[]>();
    for (const productId of uniqueProductIds) {
      const availableLots =
        await StockRepository.getAvailableLotsOrderByDate(productId);
      lotsByProduct.set(
        productId,
        availableLots.map((lot) => ({
          id: lot.id,
          lotNumber: lot.lotNumber,
          quantity: lot.quantity,
          expiryDate: lot.expiryDate,
          storageLocation: lot.storageLocation,
          productId: lot.productId,
        })),
      );
    }

    // Track consumed lot quantities across sale items sharing the same product
    // so that suggested allocations don't over-allocate a single lot.
    const consumedByLot = new Map<string, number>();

    const lotOptions: SaleItemLotOptionsExtended[] = sale.items.map((item) => {
      const lotInfos = lotsByProduct.get(item.productId) || [];

      // Check if this sale already has LOT allocations
      const existingAllocations: SuggestedAllocation[] =
        item.lotAllocations?.map((la) => ({
          lotId: la.lotId,
          lotNumber: la.lot.lotNumber,
          quantity: la.quantity,
        })) || [];

      let suggestedAllocations: SuggestedAllocation[];

      if (existingAllocations.length > 0) {
        suggestedAllocations = existingAllocations;
      } else {
        // Build effective lots with remaining quantities after prior items' allocations
        const effectiveLots = lotInfos.map((lot) => ({
          ...lot,
          quantity: Math.max(0, lot.quantity - (consumedByLot.get(lot.id) || 0)),
        }));

        suggestedAllocations = calculateSuggestedAllocations(
          effectiveLots,
          item.quantity,
        );

        // Track what this item consumed
        for (const alloc of suggestedAllocations) {
          consumedByLot.set(
            alloc.lotId,
            (consumedByLot.get(alloc.lotId) || 0) + alloc.quantity,
          );
        }
      }

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
    });

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

