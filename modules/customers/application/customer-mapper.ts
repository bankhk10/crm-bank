import { CustomerFormData, CustomerPayload } from "../types";
import { FarmPlot } from "../types";

export function mapFormDataToPayload(formData: CustomerFormData): CustomerPayload {
  // Strip spaces from customer code
  const customerCode = formData.customerCode?.trim().replace(/\s/g, "") ?? "";
  
  // Combine prefix, first, last name for the full name if it's not a company,
  // but wait, "name" field is used for companyName in dealer/subdealer, 
  // and for farmer/broker it's their full name. 
  // Let's construct a normalized "name" field based on type if needed, 
  // or just use formData.name (which is companyName for DEALER).
  // In the legacy code for FARMER, it was: name = `${prefix} ${firstName} ${lastName}`.
  
  let finalName = formData.name?.trim() ?? "";
  let contactPerson = formData.contactPerson?.trim() ?? "";

  if (formData.customerType === "FARMER" || formData.customerType === "BROKER") {
    // For individual types, the company name IS the person's name
    finalName = `${formData.prefix ? `${formData.prefix} ` : ""}${formData.firstName ?? ""} ${formData.lastName ?? ""}`.trim();
  }

  // If contactPerson wasn't explicitly provided, infer it
  if (!contactPerson && formData.firstName && formData.lastName) {
    contactPerson = `${formData.firstName} ${formData.lastName}`.trim();
  }

  return {
    ...formData,
    customerCode,
    name: finalName,
    contactPerson,
    // Explicitly fallback optional fields to ensure undefined doesn't break Prisma
    email: formData.email || undefined,
    phone: formData.phone || undefined,
    birthDate: formData.birthDate || undefined,
    postalCode: formData.postalCode ? String(formData.postalCode) : undefined,
    relationshipScore: formData.relationshipScore != null ? Number(formData.relationshipScore) : undefined,
    
    // Arrays
    shippingAddresses: formData.shippingAddresses || [],
    contacts: formData.contacts || [],
    images: formData.images || [],

    // Clean up farmPlots if it's a farmer
    farmPlots: formData.customerType === "FARMER" && formData.farmPlots 
      ? formData.farmPlots.map((p: any) => ({
          latitude: p.latitude || undefined,
          longitude: p.longitude || undefined,
          areaRai: p.areaRai || undefined,
          cropType: p.cropType || undefined,
          variety: p.variety || undefined,
          soilType: p.soilType || undefined,
          waterSource: p.waterSource || undefined,
        }))
      : undefined,
  };
}
