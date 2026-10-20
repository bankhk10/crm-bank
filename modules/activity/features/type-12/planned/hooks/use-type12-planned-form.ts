import { useState, useEffect } from "react";
import type { Type12TourDataPayload } from "../types/planned.types";
import { validateType12FormValues } from "../application/planned-validation";
import { hydrateType12PlannedData } from "../application/planned-mapper";

export interface UseType12PlannedFormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType12PlannedFormResult {
  type12TourType: string;
  setType12TourType: React.Dispatch<React.SetStateAction<string>>;
  type12TourSize: string;
  setType12TourSize: React.Dispatch<React.SetStateAction<string>>;
  type12Country: string;
  setType12Country: React.Dispatch<React.SetStateAction<string>>;
  type12Store: string;
  setType12Store: React.Dispatch<React.SetStateAction<string>>;
  type12StoreId: string;
  setType12StoreId: React.Dispatch<React.SetStateAction<string>>;
  type12Destination: string;
  setType12Destination: React.Dispatch<React.SetStateAction<string>>;
  validateType12: () => { isValid: boolean; error?: string };
  mapType12Payload: (customers?: any[]) => {
    tourData: Type12TourDataPayload | null;
  };
}

export function useType12PlannedForm({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType12PlannedFormOptions): UseType12PlannedFormResult {
  const hydrated = hydrateType12PlannedData(initial, initDetails);

  const [type12TourType, setType12TourType] = useState<string>(hydrated.tourType);
  const [type12TourSize, setType12TourSize] = useState<string>(hydrated.tourSize);
  const [type12Country, setType12Country] = useState<string>(hydrated.country);
  const [type12Store, setType12Store] = useState<string>(hydrated.store);
  const [type12StoreId, setType12StoreId] = useState<string>(hydrated.storeId);
  const [type12Destination, setType12Destination] = useState<string>(hydrated.destination);

  // Sync state if initial changes dynamically
  useEffect(() => {
    if (initial?.tour || initial?.tourData) {
      const refreshed = hydrateType12PlannedData(initial, null);
      setType12TourType(refreshed.tourType);
      setType12TourSize(refreshed.tourSize);
      setType12Country(refreshed.country);
      setType12Store(refreshed.store);
      setType12StoreId(refreshed.storeId);
      setType12Destination(refreshed.destination);
    }
  }, [initial]);

  const validateType12 = (): { isValid: boolean; error?: string } => {
    return validateType12FormValues({
      selectedWorkTypes,
      type12TourType,
      type12TourSize,
      type12Country,
      type12Store,
      type12Destination,
    });
  };

  const mapType12Payload = (customers: any[] = customersList) => {
    const isSelected =
      selectedWorkTypes.includes("ทัวร์") ||
      selectedWorkTypes.includes("TYPE_12") ||
      selectedWorkTypes.includes("พาลูกค้าศึกษาดูงาน (ทัวร์)");

    if (!isSelected) {
      return { tourData: null };
    }

    const isStore =
      type12TourType === "ทัวร์ร้านค้า" || type12TourType === "STORE";

    const resolvedStoreId =
      type12StoreId ||
      customers.find((c) => c.name === type12Store || c.id === type12Store)?.id ||
      null;

    const tourData: Type12TourDataPayload = {
      tourType: isStore ? "STORE" : "CENTRAL",
      tourSize: isStore
        ? null
        : type12TourSize === "ทัวร์ใหญ่" || type12TourSize === "LARGE"
          ? "LARGE"
          : "SMALL",
      country: !isStore ? type12Country.trim() || null : null,
      storeId: isStore ? resolvedStoreId : null,
      destination: isStore ? type12Destination.trim() || null : null,
    };

    return { tourData };
  };

  return {
    type12TourType,
    setType12TourType,
    type12TourSize,
    setType12TourSize,
    type12Country,
    setType12Country,
    type12Store,
    setType12Store,
    type12StoreId,
    setType12StoreId,
    type12Destination,
    setType12Destination,
    validateType12,
    mapType12Payload,
  };
}

export const useType12Form = useType12PlannedForm;
