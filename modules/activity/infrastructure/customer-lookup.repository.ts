import { db } from "@/lib/db";

/**
 * Fetch Farmer customers filtered optionally by province
 */
export async function findFarmerCustomerOptions(province?: string) {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      customerType: "FARMER",
      ...(province && province.trim() ? { province: province.trim() } : {}),
    },
    select: {
      id: true,
      name: true,
      customerCode: true,
      customerType: true,
      phone: true,
      farmPlots: true,
      province: true,
      district: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch Dealer & Subdealer customers for selection in Store Visits & Activity Plans
 */
export async function findDealerAndSubdealerCustomerOptions() {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      customerType: {
        in: ["DEALER", "SUBDEALER"],
      },
    },
    select: {
      id: true,
      name: true,
      customerCode: true,
      customerType: true,
      phone: true,
      province: true,
      district: true,
      addressLine: true,
      subdistrict: true,
      postalCode: true,
      parentDealerId: true,
    },
    orderBy: { name: "asc" },
  });
}
