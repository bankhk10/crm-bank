import type { UserDemoPlotOption } from "@/modules/activity-plans/constants";

export interface Type10FieldDayProps {
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
  demoPlots?: UserDemoPlotOption[];
}
