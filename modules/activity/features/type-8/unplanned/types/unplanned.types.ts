import type {
  Type8ImageFile,
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8VenueType,
  Type8PromotionalProductLine,
  ProductSaleDetail,
  Type8CustomerOption,
  Type8ProductOption,
} from "../../shared/types";

export interface Type8UnplannedItem {
  id: string;
  topic: string;
  meetingTarget: Type8MeetingTarget;
  farmerChannel?: Type8FarmerChannel;

  customerId?: string | null;
  customerName?: string | null;
  subdealerId?: string | null;
  subdealerName?: string | null;
  isNewSubdealer?: boolean;

  venueType?: Type8VenueType;
  location?: string | null;

  meetingDate?: string;
  meetingTime?: string;

  expectedAttendees?: string | number | null;
  actualAttendees?: string | number | null;

  promotions?: Type8PromotionalProductLine[];
  productSalesDetails?: ProductSaleDetail[];

  feedbackQnA?: string | null;
  notes?: string | null;

  registrationImages?: Type8ImageFile[];
  images?: Type8ImageFile[];
}

export interface Type8UnplannedValidationResult {
  isValid: boolean;
  errors?: string[];
  error?: string;
}

export interface Type8UnplannedFormProps {
  readonly?: boolean;
  items: Type8UnplannedItem[];
  customers?: Type8CustomerOption[];
  products?: Type8ProductOption[];
  addItem?: () => void;
  updateItem: (id: string, field: keyof Type8UnplannedItem | string, val: any) => void;
  deleteItem?: (id: string) => void;
  addPromotion?: (itemId: string) => void;
  updatePromotion?: (
    itemId: string,
    promoId: string,
    field: keyof Type8PromotionalProductLine,
    val: any,
  ) => void;
  deletePromotion?: (itemId: string, promoId: string) => void;
}
