/**
 * Type 15 Feature: Actual & View Types & Interfaces (บูมทีม / คาราวาน)
 */

import type { ImageFile } from "@/modules/activity/application/media/image-uploader";
import type { Type15TargetItem, Type15BoomItem, Type15ImageFile } from "../../shared/types";

export interface Type15ActualFormProps {
  isVisible?: boolean;
  planType?: "PLANNED" | "UNPLANNED" | string;
  target?: Type15TargetItem;
  targets?: Type15TargetItem[];
  customers?: Array<{ id: string; name: string; customerCode?: string | null }>;
  detail: string;
  setDetail: (val: string) => void;
  images: ImageFile[];
  setImages: (val: ImageFile[]) => void;
  readonly?: boolean;
}

export type ActualType15BoomProps = Type15ActualFormProps;

export interface Type15DetailViewProps {
  isVisible?: boolean;
  target?: Type15TargetItem;
  targets?: Type15TargetItem[];
  actual?: {
    detail?: string | null;
    attachments?: Array<{ id?: string; fileUrl?: string; url?: string; fileName?: string; name?: string; [key: string]: any }>;
    images?: Array<{ id?: string; fileUrl?: string; url?: string; fileName?: string; name?: string; [key: string]: any }>;
    [key: string]: any;
  } | null;
  images?: Type15ImageFile[];
  isActualRecorded?: boolean;
  readonly?: boolean;
}

export type DetailType15BoomProps = Type15DetailViewProps;

export interface Type15PlanCardProps {
  target?: Type15TargetItem;
  targets?: Type15TargetItem[];
  className?: string;
}

export interface Type15ApprovalCardProps {
  target?: Type15TargetItem;
  targets?: Type15TargetItem[];
  className?: string;
}

export interface UseType15ActualOptions {
  initial?: any;
  targets?: Type15TargetItem[];
}

export interface UseType15ActualResult {
  detail: string;
  setDetail: (val: string) => void;
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  validateActual: () => { isValid: boolean; error?: string };
  mapActualPayload: () => {
    type15Actual: {
      detail: string;
      images: Array<{
        url: string;
        name: string;
        size?: number;
        mimeType?: string;
      }>;
    };
  };
  hydrate: (resultData: any, attachmentsData?: any[]) => void;
}
