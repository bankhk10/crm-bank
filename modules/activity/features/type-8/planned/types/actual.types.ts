import type React from "react";
import type { Type8ImageFile, ProductSaleDetail } from "../../shared/types";
import type { Type8TargetItem } from "./planned.types";

export type { ProductSaleDetail };

export interface Type8ActualRecord {
  t8ActualAttendees?: string | number;
  t8FeedbackQnA?: string;
  t8ProductSalesDetails?: ProductSaleDetail[];
  t8Images?: Type8ImageFile[];
  t8RegistrationImages?: Type8ImageFile[];
  [key: string]: any;
}

export interface Type8ActualFormProps {
  isVisible?: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type8TargetItem;
  targets?: Type8TargetItem[];
  products?: Array<{
    id: string;
    name: string;
    productCode?: string | null;
    price?: number | null;
    unit?: string | null;
    [key: string]: any;
  }>;
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  feedbackQnA: string;
  setFeedbackQnA: (v: string) => void;
  productSalesDetails?: ProductSaleDetail[];
  setProductSalesDetails?: (v: ProductSaleDetail[]) => void;
  images: Type8ImageFile[];
  setImages: (v: Type8ImageFile[]) => void;
  registrationImages?: Type8ImageFile[];
  setRegistrationImages?: (v: Type8ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
  readonly?: boolean;
}

export type ActualType8MeetingProps = Type8ActualFormProps;

export interface Type8DetailViewProps {
  isVisible?: boolean;
  target?: Type8TargetItem;
  targets?: Type8TargetItem[];
  actualAttendees?: string;
  feedbackQnA?: string;
  productSalesDetails?: ProductSaleDetail[];
  images?: Type8ImageFile[];
  registrationImages?: Type8ImageFile[];
}

export type DetailType8MeetingProps = Type8DetailViewProps;

export interface Type8ApprovalCardProps {
  isVisible?: boolean;
  target?: Type8TargetItem;
  targets?: Type8TargetItem[];
  plan?: any;
}

export type ApprovalType8MeetingProps = Type8ApprovalCardProps;

export interface Type8ActualValidationInput {
  activityResultStatus?: string;
  t8RegistrationImages?: Type8ImageFile[];
}
