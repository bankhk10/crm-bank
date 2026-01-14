/**
 * Address Utilities
 * Helper functions for parsing and formatting Thai addresses
 */

import type { ParsedAddress } from "../types";

/**
 * Parse Thai address from string
 * Extracts province, district, subdistrict, and postal code
 */
export function parseAddress(address: string): ParsedAddress {
  if (!address) return { street: "", thaiAddress: {} };

  let street = address;
  const thaiAddress: ParsedAddress["thaiAddress"] = {};

  // 1. Extract Postal Code (5 digits at end or alone)
  const postalMatch =
    street.match(/\s+(\d{5})\s*$/) || street.match(/(\d{5})\s*$/);
  if (postalMatch) {
    thaiAddress.postalCode = postalMatch[1];
    street = street.replace(postalMatch[0], "");
  }

  // 2. Province (Changwat)
  let provinceFound = false;
  const provinceMatch = street.match(/(?:จังหวัด|จ\.)\s*([^\s]+)/);
  if (provinceMatch) {
    thaiAddress.province = provinceMatch[1];
    street = street.replace(provinceMatch[0], "");
    provinceFound = true;
  }

  if (!provinceFound) {
    // Special case for Bangkok without prefix
    const bkkMatch = street.match(/\s+(กรุงเทพมหานคร|กรุงเทพฯ|กทม\.)/);
    if (bkkMatch) {
      thaiAddress.province = bkkMatch[1];
      street = street.replace(bkkMatch[0], "");
    }
  }

  // 3. District (Amphoe/Khet)
  const districtMatch = street.match(/(?:อำเภอ|อ\.|เขต)\s*([^\s]+)/);
  if (districtMatch) {
    thaiAddress.district = districtMatch[1];
    street = street.replace(districtMatch[0], "");
  }

  // 4. Subdistrict (Tambon/Khwaeng)
  const subdistrictMatch = street.match(/(?:ตำบล|ต\.|แขวง)\s*([^\s]+)/);
  if (subdistrictMatch) {
    thaiAddress.subdistrict = subdistrictMatch[1];
    street = street.replace(subdistrictMatch[0], "");
  }

  return { street: street.trim().replace(/,\s*$/, ""), thaiAddress };
}

/**
 * Build full address from parts
 */
export function buildFullAddress(
  addressLine: string | undefined,
  subdistrict: string | undefined,
  district: string | undefined,
  province: string | undefined,
  postalCode: string | undefined
): string {
  const parts = [
    addressLine,
    subdistrict ? `ตำบล${subdistrict}` : "",
    district ? `อำเภอ${district}` : "",
    province ? `จังหวัด${province}` : "",
    postalCode || "",
  ].filter(Boolean);

  return parts.join(" ");
}

/**
 * Build shipping address from customer
 */
export function buildCustomerShippingAddress(customer: {
  shippingAddressLine?: string;
  shippingSubdistrict?: string;
  shippingDistrict?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
}): string {
  return buildFullAddress(
    customer.shippingAddressLine,
    customer.shippingSubdistrict,
    customer.shippingDistrict,
    customer.shippingProvince,
    customer.shippingPostalCode
  );
}

/**
 * Build company address
 */
export function buildCompanyAddress(company: {
  addressLine?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}): string {
  return buildFullAddress(
    company.addressLine,
    company.subdistrict,
    company.district,
    company.province,
    company.postalCode
  );
}

/**
 * Clean prefix from address part
 */
export function cleanAddressPrefix(
  value: string | undefined,
  prefixes: string[]
): string {
  if (!value) return "";
  let cleaned = value;
  for (const prefix of prefixes) {
    cleaned = cleaned.replace(new RegExp(`^${prefix}`), "");
  }
  return cleaned.trim();
}
