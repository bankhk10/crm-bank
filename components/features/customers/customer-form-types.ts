export type CustomerPayload = {
  customerCode: string;
  customerType: "DEALER" | "SUBDEALER" | "FARMER" | "BROKER";
  name: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  status?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  birthDate?: string;
  images?: any[];
};

export type SubmitResult = {
  success: boolean;
  issues?: Record<string, string[]>;
  error?: string;
  data?: any;
};

export interface CustomerFormProps {
  initial?: Partial<CustomerPayload>;
  customerType?: "DEALER" | "SUBDEALER" | "FARMER" | "BROKER";
  onSubmit: (payload: CustomerPayload) => Promise<SubmitResult>;
  onCancel?: () => void;
  submitLabel?: string;
}
