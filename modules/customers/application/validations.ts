import { z } from "zod";

// Base schema for all customer types
export const customerBaseSchema = z.object({
  // Basic Info
  customerCode: z.string().trim().min(1, "กรุณากรอกรหัสลูกค้า"),
  customerType: z.enum(["DEALER", "SUBDEALER", "FARMER", "BROKER"]),
  name: z.string().trim().min(2, "กรุณากรอกชื่อร้านค้า/บริษัท"),
  taxId: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  
  // Contacts
  contactPerson: z.string().optional().or(z.literal("")),
  prefix: z.string().min(1, "กรุณาเลือกคำนำหน้า"),
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล"),
  birthDate: z.string().optional().or(z.literal("")),
  contactPhone: z.string().trim().min(1, "กรุณากรอกเบอร์โทรศัพท์บุคคล"),
  contactEmail: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  
  // Addresses
  addressLine: z.string().optional().or(z.literal("")),
  province: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  subdistrict: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  billingAddressLine: z.string().optional().or(z.literal("")),
  billingProvince: z.string().optional().or(z.literal("")),
  billingDistrict: z.string().optional().or(z.literal("")),
  billingSubdistrict: z.string().optional().or(z.literal("")),
  billingPostalCode: z.string().optional().or(z.literal("")),
  shippingAddressLine: z.string().optional().or(z.literal("")),
  shippingProvince: z.string().optional().or(z.literal("")),
  shippingDistrict: z.string().optional().or(z.literal("")),
  shippingSubdistrict: z.string().optional().or(z.literal("")),
  shippingPostalCode: z.string().optional().or(z.literal("")),
  
  // Shared Additional Info
  notes: z.string().optional().or(z.literal("")),
  responsibleEmployeeId: z.string().optional().or(z.literal("")),
  parentDealerId: z.string().optional().or(z.literal("")),
  relationshipScore: z.coerce.number().int().optional().nullable(),
  
  // Arrays
  images: z.any().optional(),
  shippingAddresses: z.array(
    z.object({
      addressLine: z.string().optional(),
      province: z.string().optional(),
      district: z.string().optional(),
      subdistrict: z.string().optional(),
      postalCode: z.string().optional(),
    })
  ).optional().default([]),
  contacts: z.array(
    z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    })
  ).optional().default([]),

  // --- Type Specific Fields (all optional in base) ---
  // SUBDEALER
  receiveFromDealer: z.string().optional().or(z.literal("")),
  mainCompetitor: z.string().optional().or(z.literal("")),
  areaCrops: z.string().optional().or(z.literal("")),
  averageMonthlyPurchase: z.string().optional().or(z.literal("")),
  mainProductSold: z.array(z.string()).optional().default([]),
  brandsSold: z.array(z.string()).optional().default([]),
  areaType: z.string().optional().or(z.literal("")),
  // FARMER
  farmPlots: z.any().optional(),
  // BROKER
  cropTypes: z.string().optional().or(z.literal("")),
  currentYield: z.string().optional().or(z.literal("")),
  farmerCount: z.string().optional().or(z.literal("")),
  plotCount: z.string().optional().or(z.literal("")),
  totalAreaRai: z.string().optional().or(z.literal("")),
  harvestPerYear: z.string().optional().or(z.literal("")),
  creditDays: z.string().optional().or(z.literal("")),
  chemicalValuePerCycle: z.string().optional().or(z.literal("")),
  chemicalQtyPerCycle: z.string().optional().or(z.literal("")),
  regularShops: z.string().optional().or(z.literal("")),
  serviceTypes: z.string().optional().or(z.literal("")),
  usedBrands: z.string().optional().or(z.literal("")),
});

// The refined schema containing cross-field validations based on customerType
export const customerSchema = customerBaseSchema.superRefine((data, ctx) => {
  // Validate fields based on Customer Type
  if (data.customerType === "DEALER") {
    if (!data.responsibleEmployeeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกพนักงานที่รับผิดชอบ",
        path: ["responsibleEmployeeId"],
      });
    }
  }

  if (data.customerType === "SUBDEALER") {
    if (!data.responsibleEmployeeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกพนักงานที่รับผิดชอบ",
        path: ["responsibleEmployeeId"],
      });
    }
  }

  // Common: customerCode can be empty during creation, but let's assume it's validated elsewhere if needed.
  // We made it min(1) above. If auto-generated, we might need to loosen it to optional if the backend generates it.
  // For the form, we often require it. Wait, the backend application layer checks if (!customerCode) then auto-generates.
  // So we should make customerCode optional in the baseSchema, and validate it on the form or backend.
});

// Since the backend handles customerCode auto-generation, we loosen customerCode here
// and create a form-specific schema if needed, or keep it optional.
export const customerBackendSchema = customerBaseSchema.extend({
  customerCode: z.string().optional().or(z.literal("")),
});

// For update, all fields are partial
export const customerUpdateSchema = customerBackendSchema.partial();
