import type { Type14PlanInput } from "../shared/types";

export interface FormattedProduct {
  productId: string;
  productName: string;
  withdrawnQuantity: number | null;
  quantityUsed: number | string;
  unit: string;
  actualRate: string;
  detail: string;
  sourceGroup: "ORIGINAL" | "SUPPLEMENTAL" | "ACTUAL_ONLY";
}

export interface FormattedFollowUpRound {
  id?: string;
  roundNumber: number;
  visitDate: any;
  daysSinceStart: number;
  productResponse: string;
  notes: string;
  groupA: FormattedProduct[];
  groupB: FormattedProduct[];
  groupC: FormattedProduct[];
  attachments: Array<{
    id?: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}

export interface Type14DetailProps {
  data: Type14PlanInput;
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  plan?: any;
}
