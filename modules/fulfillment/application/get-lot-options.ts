import { FulfillmentRepository } from "../infrastructure/fulfillment.repository";
import type { LotInfo } from "@/modules/products/types/stock";

export interface SuggestedAllocation {
  lotId: string;
  lotNumber: string;
  quantity: number;
}

function calculateSuggestedAllocations(
  availableLots: LotInfo[],
  requiredQuantity: number,
): SuggestedAllocation[] {
  const allocations: SuggestedAllocation[] = [];
  let remaining = requiredQuantity;
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

export async function getLotOptionsUseCase(saleId: string) {
  const data = await FulfillmentRepository.getLotOptions(saleId);
  if (!data) return null;

  // Track consumed lot quantities across sale items sharing the same product
  // so that suggested allocations don't over-allocate a single lot.
  const consumedByLot = new Map<string, number>();

  const items = data.items.map((item) => {
    let suggestedAllocations: SuggestedAllocation[];

    if (item.existingAllocations.length > 0) {
      suggestedAllocations = item.existingAllocations;
    } else {
      // Build effective lots with remaining quantities after prior items' allocations
      const effectiveLots = item.availableLots.map((lot) => ({
        ...lot,
        quantity: Math.max(0, lot.quantity - (consumedByLot.get(lot.id) || 0)),
      }));

      suggestedAllocations = calculateSuggestedAllocations(
        effectiveLots,
        item.requiredQuantity,
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
      ...item,
      suggestedAllocations,
    };
  });

  return { ...data, items };
}
