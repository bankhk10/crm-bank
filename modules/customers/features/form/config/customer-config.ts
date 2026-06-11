import { CustomerType } from "../../../types";

export interface CustomerConfig {
  type: CustomerType;
  displayName: string;
  codePrefix: string;
}

export const CUSTOMER_CONFIG: Record<CustomerType, CustomerConfig> = {
  DEALER: {
    type: "DEALER",
    displayName: "Dealer (ผู้แทนจำหน่าย)",
    codePrefix: "D",
  },
  SUBDEALER: {
    type: "SUBDEALER",
    displayName: "Sub-Dealer (ร้านค้าย่อย)",
    codePrefix: "S",
  },
  FARMER: {
    type: "FARMER",
    displayName: "Farmer (เกษตรกร)",
    codePrefix: "F",
  },
  BROKER: {
    type: "BROKER",
    displayName: "Broker (นายหน้า)",
    codePrefix: "B",
  },
};

export const getCustomerConfig = (type: CustomerType): CustomerConfig => {
  return CUSTOMER_CONFIG[type];
};
