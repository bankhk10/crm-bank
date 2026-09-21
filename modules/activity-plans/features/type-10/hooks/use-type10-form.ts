import { useState } from "react";
import { isFieldDayItem } from "@/modules/activity-plans/constants";

export interface UseType10FormOptions {
  initial?: any;
  initDetails?: any;
  demoPlotsList?: any[];
  selectedWorkTypes?: string[];
}

export interface UseType10FormResult {
  type10DemoPlot: string;
  setType10DemoPlot: React.Dispatch<React.SetStateAction<string>>;
  type10Location: string;
  setType10Location: React.Dispatch<React.SetStateAction<string>>;
  type10TargetCrop: string;
  setType10TargetCrop: React.Dispatch<React.SetStateAction<string>>;
  type10Showcase: string;
  setType10Showcase: React.Dispatch<React.SetStateAction<string>>;
  type10Attendees: number;
  setType10Attendees: React.Dispatch<React.SetStateAction<number>>;
  type10BookingSales: number;
  setType10BookingSales: React.Dispatch<React.SetStateAction<number>>;
  validateType10: () => { isValid: boolean; error?: string };
  mapType10Payload: (demoPlots: any[]) => {
    submittedDemoPlotId: string | null;
    targetAttendees: number | null;
    targetBookingSales: number | null;
  };
}

export function useType10Form({
  initial = {},
  initDetails,
  demoPlotsList = [],
  selectedWorkTypes = [],
}: UseType10FormOptions): UseType10FormResult {
  const [type10DemoPlot, setType10DemoPlot] = useState<string>(() => {
    if ((initial as any)?.demoPlotId) return (initial as any).demoPlotId;
    if ((initial as any)?.demoPlotVisits?.[0]?.demoPlotId)
      return (initial as any).demoPlotVisits[0].demoPlotId;
    if (initDetails?.type10DemoPlot) return initDetails.type10DemoPlot;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item) return item.customerName || item.plotOwnerName || "";
    }
    return "";
  });

  const [type10Location, setType10Location] = useState<string>(() => {
    if (initDetails?.type10Location) return initDetails.type10Location;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.detail) {
        const match = item.detail.match(/สถานที่:\s*([^|]+)/);
        if (match) return match[1].trim();
      }
    }
    return "";
  });

  const [type10TargetCrop, setType10TargetCrop] = useState<string>(() => {
    if (initDetails?.type10TargetCrop) return initDetails.type10TargetCrop;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.plotCropName) return item.plotCropName;
      if (item?.detail) {
        const match = item.detail.match(/พืชเป้าหมาย:\s*([^|]+)/);
        if (match) return match[1].trim();
      }
    }
    return "";
  });

  const [type10Showcase, setType10Showcase] = useState<string>(() => {
    if (initDetails?.type10Showcase) return initDetails.type10Showcase;
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.plotProductName) return item.plotProductName;
      if (item?.detail) {
        const match = item.detail.match(/สินค้าโชว์:\s*([^|]+)/);
        if (match) return match[1].trim();
      }
    }
    return "";
  });

  const [type10Attendees, setType10Attendees] = useState<number>(() => {
    if ((initial as any)?.targetAttendeesCount != null)
      return Number((initial as any).targetAttendeesCount);
    if (initDetails?.type10Attendees != null)
      return Number(initDetails.type10Attendees);
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.meetingAttendeesCount != null)
        return Number(item.meetingAttendeesCount);
      if (item?.targetAttendees != null) return Number(item.targetAttendees);
      if (item?.detail) {
        const match =
          item.detail.match(/ผู้ร่วมงาน:\s*(\d+)/) ||
          item.detail.match(/เป้าผู้ร่วมงาน:\s*(\d+)/);
        if (match) return Number(match[1]);
      }
    }
    return 0;
  });

  const [type10BookingSales, setType10BookingSales] = useState<number>(() => {
    if ((initial as any)?.targetBookingSales != null)
      return Number((initial as any).targetBookingSales);
    if (initDetails?.type10BookingSales != null)
      return Number(initDetails.type10BookingSales);
    if (Array.isArray(initDetails)) {
      const item = initDetails.find(isFieldDayItem);
      if (item?.saleTotalPrice != null) return Number(item.saleTotalPrice);
      if (item?.targetSales != null) return Number(item.targetSales);
      if (item?.detail) {
        const match = item.detail.match(/เป้ายอดจอง:\s*(?:฿)?([\d,]+)/);
        if (match) return Number(match[1].replace(/,/g, ""));
      }
    }
    return 0;
  });

  const validateType10 = (): { isValid: boolean; error?: string } => {
    return { isValid: true };
  };

  const mapType10Payload = (demoPlots: any[]) => {
    if (!selectedWorkTypes.includes("จัดงาน Field Day")) {
      return {
        submittedDemoPlotId: null,
        targetAttendees: null,
        targetBookingSales: null,
      };
    }

    let submittedDemoPlotId: string | null = null;
    let targetAttendees: number | null = null;
    let targetBookingSales: number | null = null;

    const plotMatch = demoPlots.find(
      (dp) =>
        dp.id === type10DemoPlot ||
        dp.ownerName === type10DemoPlot ||
        dp.code === type10DemoPlot,
    );
    if (plotMatch?.id || type10DemoPlot) {
      submittedDemoPlotId = plotMatch?.id || type10DemoPlot || null;
    }
    if (type10Attendees != null && Number(type10Attendees) > 0) {
      targetAttendees = Number(type10Attendees);
    }
    if (type10BookingSales != null && Number(type10BookingSales) > 0) {
      targetBookingSales = Number(type10BookingSales);
    }

    return {
      submittedDemoPlotId,
      targetAttendees,
      targetBookingSales,
    };
  };

  return {
    type10DemoPlot,
    setType10DemoPlot,
    type10Location,
    setType10Location,
    type10TargetCrop,
    setType10TargetCrop,
    type10Showcase,
    setType10Showcase,
    type10Attendees,
    setType10Attendees,
    type10BookingSales,
    setType10BookingSales,
    validateType10,
    mapType10Payload,
  };
}
