import { useState } from "react";

export interface UseType12FormOptions {
  initial?: any;
  initDetails?: any;
  customersList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType12FormResult {
  type12TourType: string;
  setType12TourType: React.Dispatch<React.SetStateAction<string>>;
  type12TourSize: string;
  setType12TourSize: React.Dispatch<React.SetStateAction<string>>;
  type12Country: string;
  setType12Country: React.Dispatch<React.SetStateAction<string>>;
  type12Store: string;
  setType12Store: React.Dispatch<React.SetStateAction<string>>;
  type12Destination: string;
  setType12Destination: React.Dispatch<React.SetStateAction<string>>;
  validateType12: () => { isValid: boolean; error?: string };
  mapType12Payload: (customers: any[]) => {
    tourData: {
      tourType: "STORE" | "CENTRAL";
      tourSize: "LARGE" | "SMALL" | null;
      country: string | null;
      storeId: string | null;
      destination: string | null;
    } | null;
  };
}

export function useType12Form({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType12FormOptions): UseType12FormResult {
  const [type12TourType, setType12TourType] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.tourType === "STORE"
        ? "ทัวร์ร้านค้า"
        : "ทัวร์กลาง";
    }
    if (initDetails?.type12TourType) return initDetails.type12TourType;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" ||
          (i.detail && i.detail.includes("[ทัวร์")) ||
          (i.visitTopic &&
            (i.visitTopic === "ทัวร์กลาง" || i.visitTopic === "ทัวร์ร้านค้า")),
      );
      if (item?.visitTopic) return item.visitTopic;
      if (item?.detail) {
        if (item.detail.includes("ทัวร์กลาง")) return "ทัวร์กลาง";
        if (item.detail.includes("ทัวร์ร้านค้า")) return "ทัวร์ร้านค้า";
      }
    }
    return "ทัวร์กลาง";
  });

  const [type12TourSize, setType12TourSize] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.tourSize === "LARGE"
        ? "ทัวร์ใหญ่"
        : "ทัวร์เล็ก";
    }
    if (initDetails?.type12TourSize) return initDetails.type12TourSize;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.detail) {
        const m = item.detail.match(/ขนาดทัวร์:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "ทัวร์เล็ก";
  });

  const [type12Country, setType12Country] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.country || "";
    }
    if (initDetails?.type12Country) return initDetails.type12Country;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.detail) {
        const m = item.detail.match(/ประเทศ:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "";
  });

  const [type12Store, setType12Store] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.store?.name || "";
    }
    if (initDetails?.type12Store) return initDetails.type12Store;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.customerName) return item.customerName;
      if (item?.detail) {
        const m = item.detail.match(/ร้านค้า:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "";
  });

  const [type12Destination, setType12Destination] = useState<string>(() => {
    if ((initial as any)?.tour) {
      return (initial as any).tour.destination || "";
    }
    if (initDetails?.type12Destination) return initDetails.type12Destination;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(
        (i: any) =>
          i.itemType === "TYPE_12" || (i.detail && i.detail.includes("[ทัวร์")),
      );
      if (item?.detail) {
        const m = item.detail.match(/สถานที่จะไป:\s*([^|]+)/);
        if (m) return m[1].trim();
      }
    }
    return "";
  });

  const validateType12 = (): { isValid: boolean; error?: string } => {
    if (!selectedWorkTypes.includes("ทัวร์")) {
      return { isValid: true };
    }
    if (!type12TourType) {
      return { isValid: false, error: "กรุณาเลือกประเภททัวร์" };
    }
    if (type12TourType === "ทัวร์กลาง") {
      if (!type12TourSize) {
        return { isValid: false, error: "กรุณาเลือกขนาดทัวร์" };
      }
      if (!type12Country.trim()) {
        return { isValid: false, error: "กรุณากรอกชื่อประเทศ" };
      }
    } else if (type12TourType === "ทัวร์ร้านค้า") {
      if (!type12Store.trim()) {
        return { isValid: false, error: "กรุณาเลือกร้านค้า" };
      }
      if (!type12Destination.trim()) {
        return { isValid: false, error: "กรุณากรอกสถานที่จะไป" };
      }
    }
    return { isValid: true };
  };

  const mapType12Payload = (customers: any[]) => {
    if (!selectedWorkTypes.includes("ทัวร์")) {
      return { tourData: null };
    }

    const tourData = {
      tourType:
        type12TourType === "ทัวร์ร้านค้า"
          ? ("STORE" as const)
          : ("CENTRAL" as const),
      tourSize:
        type12TourType === "ทัวร์ร้านค้า"
          ? null
          : type12TourSize === "ทัวร์ใหญ่"
            ? ("LARGE" as const)
            : ("SMALL" as const),
      country:
        type12TourType === "ทัวร์กลาง"
          ? type12Country.trim() || null
          : null,
      storeId:
        type12TourType === "ทัวร์ร้านค้า"
          ? customers.find((c) => c.name === type12Store)?.id || null
          : null,
      destination:
        type12TourType === "ทัวร์ร้านค้า"
          ? type12Destination.trim() || null
          : null,
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
    type12Destination,
    setType12Destination,
    validateType12,
    mapType12Payload,
  };
}
