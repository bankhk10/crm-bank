import type React from "react";
import type { Type10DemoPlotOption } from "../../shared/types";

export interface Type10TargetItem {
  id?: string;
  demoPlotId?: string | null;
  plot?: string;
  location?: string;
  showcase?: string;
  crop?: string;
  targetAttendees?: string;
  targetSales?: string;
  [key: string]: any;
}

export interface Type10PlanItem {
  demoPlotId?: string | null;
  location?: string;
  targetAttendeesCount?: number;
  targetBookingSales?: number;
  products?: Array<{
    productId: string;
    productName?: string | null;
  }>;
}

export interface Type10PlanTarget {
  id?: string;
  plot?: string;
  location?: string;
  showcase?: string;
  crop?: string;
  targetAttendees?: number | string;
  targetSales?: number | string;
  [key: string]: any;
}

export interface Type10PlannedFormProps {
  readonly?: boolean;
  isEdit?: boolean;
  type10DemoPlot: string;
  setType10DemoPlot: (val: string) => void;
  type10Location?: string;
  setType10Location?: (val: string) => void;
  type10TargetCrop?: string;
  setType10TargetCrop?: (val: string) => void;
  type10Showcase?: string;
  setType10Showcase?: (val: string) => void;
  type10Attendees: number;
  setType10Attendees: (val: number) => void;
  type10BookingSales: number;
  setType10BookingSales: (val: number) => void;
  demoPlots?: Type10DemoPlotOption[];
}

export type Type10FieldDayProps = Type10PlannedFormProps;
export type Type10PlanFormProps = Type10PlannedFormProps;

export interface Type10PlanCardProps {
  target?: Type10PlanTarget;
  planType?: string;
  className?: string;
}

export interface ValidateType10Options {
  selectedWorkTypes?: string[];
  type10DemoPlot?: string;
  type10Attendees?: number;
}

export interface Type10ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

export interface UseType10PlannedFormOptions {
  initial?: any;
  initDetails?: any;
  demoPlotsList?: Type10DemoPlotOption[];
  selectedWorkTypes?: string[];
}

export interface UseType10PlannedFormResult {
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
  validateType10: () => Type10ValidationResult;
  mapType10Payload: (demoPlots?: Type10DemoPlotOption[]) => {
    submittedDemoPlotId: string | null;
    targetAttendees: number | null;
    targetBookingSales: number | null;
  };
}
