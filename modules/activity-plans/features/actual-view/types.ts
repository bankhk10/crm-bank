export interface ImageFile {
  id: string;
  url: string;
  name: string;
}

export interface PlanSummaryData {
  title: string;
  dateStr: string;
  timeStr: string;
  locationStr: string;
  demoPlotTarget: string;
  salesTarget: string;
  attendeeTarget: string;
}

export interface ActualTargetItem {
  label: string;
  value: string;
  highlight?: boolean;
  colSpan?: string;
}
