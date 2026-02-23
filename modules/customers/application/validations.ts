import { z } from "zod";

export const customerSchema = z.object({
  customerCode: z.string().min(1).optional(),
  customerType: z.enum(["DEALER", "SUBDEALER", "FARMER", "BROKER"]),
  name: z.string().min(2),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  relationshipScore: z.number().int().optional(),
  parentDealerId: z.string().optional(),
  responsibleEmployeeId: z.string().optional(),
  prefix: z.string().optional(),
  firstName: z.string().optional(),
  birthDate: z.string().optional().or(z.literal("")),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  addressLine: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  billingAddressLine: z.string().optional(),
  billingProvince: z.string().optional(),
  billingDistrict: z.string().optional(),
  billingSubdistrict: z.string().optional(),
  billingPostalCode: z.string().optional(),
  shippingAddressLine: z.string().optional(),
  shippingProvince: z.string().optional(),
  shippingDistrict: z.string().optional(),
  shippingSubdistrict: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  // SUBDEALER specific fields
  receiveFromDealer: z.string().optional(),
  mainCompetitor: z.string().optional(),
  areaCrops: z.string().optional(),
  averageMonthlyPurchase: z.string().optional(),
  mainProductSold: z.array(z.string()).optional(),
  brandsSold: z.array(z.string()).optional(),
  areaType: z.string().optional(),
  // FARMER specific fields
  farmPlots: z.any().optional(),
  // BROKER specific fields
  cropTypes: z.string().optional(),
  currentYield: z.string().optional(),
  farmerCount: z.string().optional(),
  plotCount: z.string().optional(),
  totalAreaRai: z.string().optional(),
  harvestPerYear: z.string().optional(),
  creditDays: z.string().optional(),
  chemicalValuePerCycle: z.string().optional(),
  chemicalQtyPerCycle: z.string().optional(),
  regularShops: z.string().optional(),
  serviceTypes: z.string().optional(),
  usedBrands: z.string().optional(),
  shippingAddresses: z
    .array(
      z.object({
        addressLine: z.string().optional(),
        province: z.string().optional(),
        district: z.string().optional(),
        subdistrict: z.string().optional(),
        postalCode: z.string().optional(),
      }),
    )
    .optional(),
  contacts: z
    .array(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
      }),
    )
    .optional(),
});

export const customerUpdateSchema = customerSchema.partial().extend({
  parentDealerId: z.string().optional().or(z.literal("")),
  responsibleEmployeeId: z.string().optional().or(z.literal("")),
  relationshipScore: z.number().int().nullable().optional(),
});
