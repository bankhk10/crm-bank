import { getRegionByProvince } from "@/lib/province-region-mapping";
import { customerSchema } from "./validations";
import {
  getHighestCustomerCode,
  createCustomer,
  checkCustomerCodeExists,
} from "../infrastructure/customer.repository";
import { generateCustomerCode } from "./generate-customer-code";

export async function createCustomerUseCase(input: any, createdById: string) {
  // Normalize postal codes to strings
  const normalizedBody =
    input && typeof input === "object" ? { ...input } : input;
  if (normalizedBody && typeof normalizedBody === "object") {
    if (typeof (normalizedBody as any).postalCode === "number") {
      (normalizedBody as any).postalCode = String(
        (normalizedBody as any).postalCode,
      );
    }
    if (typeof (normalizedBody as any).billingPostalCode === "number") {
      (normalizedBody as any).billingPostalCode = String(
        (normalizedBody as any).billingPostalCode,
      );
    }
    if (typeof (normalizedBody as any).shippingPostalCode === "number") {
      (normalizedBody as any).shippingPostalCode = String(
        (normalizedBody as any).shippingPostalCode,
      );
    }
    if (Array.isArray((normalizedBody as any).shippingAddresses)) {
      (normalizedBody as any).shippingAddresses.forEach((addr: any) => {
        if (typeof addr.postalCode === "number") {
          addr.postalCode = String(addr.postalCode);
        }
      });
    }
  }

  const parsed = customerSchema.safeParse(normalizedBody);

  if (!parsed.success) {
    throw new Error(
      JSON.stringify({
        message: "Invalid payload",
        issues: parsed.error.flatten().fieldErrors,
      }),
    );
  }

  const data = parsed.data;

  // Auto-generate customer code if not provided
  let customerCode = data.customerCode;

  if (!customerCode) {
    customerCode = await generateCustomerCode(data.customerType);
  } else {
    // Check if the provided customer code already exists (including soft-deleted)
    const existing = await checkCustomerCodeExists(customerCode);
    if (existing) {
      if (existing.deletedAt) {
        throw new Error(`รหัสลูกค้านี้ (${customerCode}) เคยถูกใช้งานแล้วแต่ถูกลบไปในระบบ ไม่สามารถใช้ซ้ำได้`);
      } else {
        throw new Error(`รหัสลูกค้านี้ (${customerCode}) มีอยู่ในระบบแล้ว`);
      }
    }
  }

  // Map to Prisma create data
  const createData: any = {
    customerCode,
    customerType: data.customerType,
    name: data.name,
    prefix: data.prefix,
    firstName: data.firstName,
    birthDate: data.birthDate ? new Date(data.birthDate) : null,
    lastName: data.lastName,
    email: data.email || null,
    phone: data.phone,
    taxId: data.taxId,
    addressLine: data.addressLine,
    province: data.province,
    region: data.province ? getRegionByProvince(data.province) : null,
    district: data.district,
    subdistrict: data.subdistrict,
    postalCode: data.postalCode,
    billingAddressLine: data.billingAddressLine,
    billingProvince: data.billingProvince,
    billingDistrict: data.billingDistrict,
    billingSubdistrict: data.billingSubdistrict,
    billingPostalCode: data.billingPostalCode,
    shippingAddressLine: data.shippingAddressLine,
    shippingProvince: data.shippingProvince,
    shippingDistrict: data.shippingDistrict,
    shippingSubdistrict: data.shippingSubdistrict,
    shippingPostalCode: data.shippingPostalCode,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    relationshipScore: data.relationshipScore ?? null,
    parentDealer: data.parentDealerId
      ? { connect: { id: data.parentDealerId } }
      : undefined,
    responsibleEmployee: data.responsibleEmployeeId
      ? { connect: { id: data.responsibleEmployeeId } }
      : undefined,
    status: data.status ?? "ACTIVE",
    contactPerson: data.contactPerson,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail || null,
    notes: data.notes,
    receiveFromDealer: data.receiveFromDealer ?? null,
    mainCompetitor: data.mainCompetitor ?? null,
    areaCrops: data.areaCrops ?? null,
    averageMonthlyPurchase: data.averageMonthlyPurchase ?? null,
    mainProductSold: data.mainProductSold ?? [],
    brandsSold: data.brandsSold ?? [],
    areaType: data.areaType ?? null,
    farmPlots: data.farmPlots ?? null,
    cropTypes: data.cropTypes ?? null,
    currentYield: data.currentYield ?? null,
    farmerCount: data.farmerCount ?? null,
    plotCount: data.plotCount ?? null,
    totalAreaRai: data.totalAreaRai ?? null,
    harvestPerYear: data.harvestPerYear ?? null,
    creditDays: data.creditDays ?? null,
    chemicalValuePerCycle: data.chemicalValuePerCycle ?? null,
    chemicalQtyPerCycle: data.chemicalQtyPerCycle ?? null,
    regularShops: data.regularShops ?? null,
    serviceTypes: data.serviceTypes ?? null,
    usedBrands: data.usedBrands ?? null,
    addresses: data.shippingAddresses
      ? {
          create: data.shippingAddresses.map((addr) => ({
            addressLine: addr.addressLine,
            province: addr.province,
            district: addr.district,
            subdistrict: addr.subdistrict,
            postalCode: addr.postalCode ? String(addr.postalCode) : undefined,
          })),
        }
      : undefined,
    contacts: data.contacts
      ? {
          create: data.contacts.map((contact) => ({
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
            email: contact.email,
          })),
        }
      : undefined,
    createdById,
  };

  return createCustomer(createData);
}
