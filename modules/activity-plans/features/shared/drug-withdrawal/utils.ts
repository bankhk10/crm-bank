import type { DrugWithdrawalItemInput } from "../../../application/validations";
import type {
  DrugWithdrawalPlotGroupState,
  DrugWithdrawalItemRowState,
  DrugWithdrawalPlotOption,
} from "./types";

let uniqueKeyCounter = 0;
export function generateClientKey(prefix = "dw"): string {
  uniqueKeyCounter += 1;
  return `${prefix}-${Date.now()}-${uniqueKeyCounter}`;
}

/**
 * Groups flat withdrawal items into plot sections for the UI
 */
export function groupItemsIntoPlots(
  items?: DrugWithdrawalItemInput[],
  availablePlots?: DrugWithdrawalPlotOption[],
): DrugWithdrawalPlotGroupState[] {
  if (!items || items.length === 0) {
    const defaultPlot = availablePlots && availablePlots.length > 0 ? availablePlots[0] : null;
    return [
      {
        key: generateClientKey("plot"),
        plotIdentifier: defaultPlot ? (defaultPlot.plotIdentifier || defaultPlot.name) : "แปลงที่ 1",
        demoPlotId: defaultPlot?.demoPlotId ?? null,
        items: [
          {
            key: generateClientKey("item"),
            productId: "",
            productName: "",
            quantity: 1,
            unit: "",
            sortOrder: 0,
          },
        ],
      },
    ];
  }

  const plotMap = new Map<string, DrugWithdrawalPlotGroupState>();
  const plotOrder: string[] = [];

  for (const item of items) {
    const plotKey = item.plotIdentifier || item.demoPlotId || "แปลงทั่วไป";
    if (!plotMap.has(plotKey)) {
      plotOrder.push(plotKey);
      plotMap.set(plotKey, {
        key: generateClientKey("plot"),
        plotIdentifier: item.plotIdentifier || plotKey,
        demoPlotId: item.demoPlotId ?? null,
        items: [],
      });
    }

    const group = plotMap.get(plotKey)!;
    group.items.push({
      key: generateClientKey("item"),
      id: item.id,
      productId: item.productId,
      productName: item.productName ?? null,
      quantity: item.quantity,
      unit: item.unit ?? null,
      sortOrder: item.sortOrder ?? group.items.length,
    });
  }

  return plotOrder.map((key) => plotMap.get(key)!);
}

/**
 * Flattens plot groups back into standard DrugWithdrawalItemInput array
 */
export function flattenPlotsToItems(
  plots: DrugWithdrawalPlotGroupState[],
): DrugWithdrawalItemInput[] {
  const result: DrugWithdrawalItemInput[] = [];
  let sortOrder = 0;

  for (const plot of plots) {
    for (const item of plot.items) {
      const parsedQty =
        typeof item.quantity === "number"
          ? item.quantity
          : parseFloat(String(item.quantity)) || 0;

      result.push({
        id: item.id,
        demoPlotId: plot.demoPlotId ?? null,
        plotIdentifier: plot.plotIdentifier ?? "",
        productId: item.productId,
        productName: item.productName ?? null,
        quantity: parsedQty,
        unit: item.unit ?? null,
        sortOrder: sortOrder++,
      });
    }
  }

  return result;
}
