"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  UseType10PlannedFormOptions,
  UseType10PlannedFormResult,
  Type10ValidationResult,
} from "../types/planned.types";
import type { Type10DemoPlotOption } from "../../shared/types";
import { hydrateType10PlannedData } from "../application/planned-mapper";
import { validateType10Form } from "../application/planned-validation";

export type { UseType10PlannedFormOptions, UseType10PlannedFormResult };

export function useType10PlannedForm({
  initial,
  initDetails,
  demoPlotsList = [],
  selectedWorkTypes = [],
}: UseType10PlannedFormOptions = {}): UseType10PlannedFormResult {
  const initialData = useMemo(() => {
    return hydrateType10PlannedData(initial || initDetails);
  }, [initial, initDetails]);

  const [type10DemoPlot, setType10DemoPlot] = useState<string>(
    initialData.demoPlotId,
  );
  const [type10Location, setType10Location] = useState<string>(
    initialData.location,
  );
  const [type10TargetCrop, setType10TargetCrop] = useState<string>(
    initialData.targetCrop,
  );
  const [type10Showcase, setType10Showcase] = useState<string>(
    initialData.showcase,
  );
  const [type10Attendees, setType10Attendees] = useState<number>(
    initialData.attendees,
  );
  const [type10BookingSales, setType10BookingSales] = useState<number>(
    initialData.bookingSales,
  );

  // Sync state if initialData is loaded/hydrated asynchronously
  useEffect(() => {
    if (initialData.demoPlotId) {
      setType10DemoPlot(initialData.demoPlotId);
    }
    if (initialData.location) {
      setType10Location(initialData.location);
    }
    if (initialData.targetCrop) {
      setType10TargetCrop(initialData.targetCrop);
    }
    if (initialData.showcase) {
      setType10Showcase(initialData.showcase);
    }
    if (initialData.attendees) {
      setType10Attendees(initialData.attendees);
    }
    if (initialData.bookingSales) {
      setType10BookingSales(initialData.bookingSales);
    }
  }, [
    initialData.demoPlotId,
    initialData.location,
    initialData.targetCrop,
    initialData.showcase,
    initialData.attendees,
    initialData.bookingSales,
  ]);

  const validateType10 = useCallback((): Type10ValidationResult => {
    return validateType10Form({
      selectedWorkTypes,
      type10DemoPlot,
      type10Attendees,
    });
  }, [selectedWorkTypes, type10DemoPlot, type10Attendees]);

  const mapType10Payload = useCallback(
    (demoPlots: Type10DemoPlotOption[] = demoPlotsList) => {
      const p = demoPlots.find(
        (plot) =>
          plot.id === type10DemoPlot ||
          plot.name === type10DemoPlot ||
          (plot as any).activityPlanId === type10DemoPlot ||
          (plot as any).activityCode === type10DemoPlot ||
          (plot as any).activityName === type10DemoPlot,
      );
      const submittedDemoPlotId = p
        ? (p as any).activityPlanId || p.id
        : type10DemoPlot && type10DemoPlot.trim() !== ""
          ? type10DemoPlot
          : null;
      const loc = type10Location || p?.location || null;
      const crop = type10TargetCrop || p?.targetCrop || p?.cropName || null;
      const sc = type10Showcase || p?.showcase || p?.primaryProductName || null;

      const targetItem = {
        demoPlotId: submittedDemoPlotId,
        type7aTargetId: p ? p.id : null,
        plotName: p?.name || (!p && type10DemoPlot ? type10DemoPlot : null),
        farmerName: p?.ownerName || null,
        location: loc,
        province: p?.province || null,
        district: p?.district || null,
        cropName: crop,
        showcaseProductName: sc,
        targetAttendeesCount: type10Attendees > 0 ? Number(type10Attendees) : 0,
        targetBookingSales: type10BookingSales > 0 ? Number(type10BookingSales) : null,
      };

      return {
        submittedDemoPlotId,
        location: loc,
        targetCrop: crop,
        showcase: sc,
        targetAttendees:
          type10Attendees !== undefined && type10Attendees !== null && type10Attendees > 0
            ? Number(type10Attendees)
            : null,
        targetBookingSales:
          type10BookingSales !== undefined && type10BookingSales !== null && type10BookingSales > 0
            ? Number(type10BookingSales)
            : null,
        plots: [targetItem],
        type10Targets: [targetItem],
      };
    },
    [type10DemoPlot, type10Location, type10TargetCrop, type10Showcase, type10Attendees, type10BookingSales, demoPlotsList],
  );

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

export const useType10Form = useType10PlannedForm;
