import type {
  Type8MeetingItem,
  Type8PromotionProductItem,
  CustomerOption,
  ProductOption,
} from "../shared/types";

export interface Type8MeetingProps {
  readonly?: boolean;
  type8Items: Type8MeetingItem[];
  addType8Row?: () => void;
  updateType8Row: (id: string, field: keyof Type8MeetingItem, val: any) => void;
  deleteType8Row?: (id: string) => void;
  addPromotionProduct?: (meetingId: string) => void;
  updatePromotionProduct?: (
    meetingId: string,
    promoId: string,
    field: keyof Type8PromotionProductItem,
    val: any,
  ) => void;
  deletePromotionProduct?: (meetingId: string, promoId: string) => void;
  customers?: CustomerOption[];
  products?: ProductOption[];
  onDealerSelect?: (dealer: CustomerOption | null) => void;
}
