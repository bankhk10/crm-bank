import type { Type6IssueItem, CustomerOption } from "../shared/types";

export interface Type6IssueProps {
  isVisible?: boolean;
  customers: CustomerOption[];
  type6Items: Type6IssueItem[];
  addType6Row: () => void;
  updateType6Row: (id: string, field: keyof Type6IssueItem, val: any) => void;
  deleteType6Row: (id: string) => void;
  title?: string;
  isPlanned?: boolean;
  readonly?: boolean;
}
