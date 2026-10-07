import type { Type14PlanInput } from "../shared/types";

export interface FormattedProduct {
  productId: string;
  productName: string;
  quantityUsed: number | string;
  unit: string;
  actualRate: string;
  detail: string;
}

export interface FormattedFollowUpRound {
  id?: string;
  roundNumber: number;
  visitDate: any;
  daysSinceStart: number;
  productResponse: string;
  notes: string;
  products: FormattedProduct[];
  attachments: Array<{
    id?: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
}

export interface Type14DetailProps {
  data?: Type14PlanInput;
  plots?: any[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  plan?: any;
}

