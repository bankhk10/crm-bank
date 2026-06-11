import { CustomerFormData } from "../../../types";
import { CustomerType } from "../../../types";

export const getCustomerDefaultValues = (type: CustomerType): Partial<CustomerFormData> => {
  const baseDefaults: Partial<CustomerFormData> = {
    customerCode: "",
    customerType: type,
    name: "",
    taxId: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    status: "ACTIVE",
    prefix: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    contactPhone: "",
    contactEmail: "",
    addressLine: "",
    province: "",
    district: "",
    subdistrict: "",
    postalCode: "",
    billingAddressLine: "",
    billingProvince: "",
    billingDistrict: "",
    billingSubdistrict: "",
    billingPostalCode: "",
    shippingAddressLine: "",
    shippingProvince: "",
    shippingDistrict: "",
    shippingSubdistrict: "",
    shippingPostalCode: "",
    notes: "",
    responsibleEmployeeId: "",
    parentDealerId: "",
    relationshipScore: null,
    shippingAddresses: [],
    contacts: [],
  };

  switch (type) {
    case "DEALER":
      return {
        ...baseDefaults,
      };
    case "SUBDEALER":
      return {
        ...baseDefaults,
        receiveFromDealer: "",
        mainCompetitor: "",
        areaCrops: "",
        averageMonthlyPurchase: "",
        mainProductSold: [],
        brandsSold: [],
        areaType: "",
      };
    case "FARMER":
      return {
        ...baseDefaults,
        farmPlots: [],
      };
    case "BROKER":
      return {
        ...baseDefaults,
        cropTypes: "",
        currentYield: "",
        farmerCount: "",
        plotCount: "",
        totalAreaRai: "",
        harvestPerYear: "",
        creditDays: "",
        chemicalValuePerCycle: "",
        chemicalQtyPerCycle: "",
        regularShops: "",
        serviceTypes: "",
        usedBrands: "",
      };
    default:
      return baseDefaults;
  }
};
