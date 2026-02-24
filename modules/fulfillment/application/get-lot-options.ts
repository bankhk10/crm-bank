import { FulfillmentRepository } from "../infrastructure/fulfillment.repository";
import type { LotInfo } from "@/src/core/stock/stock.types";

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

  const items = data.items.map((item) => {
    const suggestedAllocations =
      item.existingAllocations.length > 0
        ? item.existingAllocations
        : calculateSuggestedAllocations(
            item.availableLots,
            item.requiredQuantity,
          );

    return {
      ...item,
      suggestedAllocations,
    };
  });

  return { ...data, items };
}
