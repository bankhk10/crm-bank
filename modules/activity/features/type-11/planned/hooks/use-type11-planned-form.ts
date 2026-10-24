import { useState } from "react";
import type { Type11StoreItem } from "../../shared/types";
import type {
  UseType11PlannedFormOptions,
  UseType11PlannedFormResult,
  Type11ValidationResult,
} from "../types/planned.types";

export type { UseType11PlannedFormOptions, UseType11PlannedFormResult };
import { validateType11FormItems } from "../application/planned-validation";
import { hydrateType11PlannedData } from "../application/planned-mapper";

export function useType11PlannedForm({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType11PlannedFormOptions): UseType11PlannedFormResult {
  const [type11Stores, setType11Stores] = useState<Type11StoreItem[]>(() => {
    const hydrated = hydrateType11PlannedData(initial, initDetails);
    if (hydrated.length > 0) return hydrated;

    if (Array.isArray(initDetails)) {
      const item = initDetails.find((i: any) => i.itemType === "TYPE_11");
      if (item && item.customerName) {
        const sMatch = customersList.find((c) => c.name === item.customerName);
        return [{ storeId: sMatch?.id || "", storeName: item.customerName }];
      }
    }
    return [];
  });

  const validateType11 = (): Type11ValidationResult => {
    return validateType11FormItems({
      selectedWorkTypes,
      type11Stores,
      stores: type11Stores,
    });
  };

  const mapType11Payload = () => {
    return {
      type11Stores,
      type11Targets: type11Stores,
    };
  };

  return {
    type11Stores,
    setType11Stores,
    validateType11,
    mapType11Payload,
  };
}

export { useType11PlannedForm as useType11Form };
