export interface AddressData {
  addressLine?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
}

export interface ParsedAddress {
  street: string;
  thaiAddress: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
}

/**
 * Format address object into a single string.
 * Automatically adds 'ต.', 'อ.', 'จ.' for normal provinces,
 * and 'แขวง', 'เขต' for Bangkok.
 */
export function formatAddress(addressData?: AddressData | null): string {
  if (!addressData) return "-";

  const parts: string[] = [];

  if (addressData.addressLine) {
    parts.push(addressData.addressLine.trim());
  }

  // Check if it's Bangkok to use แขวง/เขต instead of ต./อ.
  const isBkk =
    addressData.province === "กรุงเทพมหานคร" ||
    addressData.province === "กทม" ||
    addressData.province === "กทม.";

  if (addressData.subdistrict) {
    const sd = addressData.subdistrict.trim();
    if (!sd.startsWith("ต.") && !sd.startsWith("แขวง")) {
      parts.push(`${isBkk ? "แขวง" : "ต."}${sd}`);
    } else {
      parts.push(sd);
    }
  }

  if (addressData.district) {
    const d = addressData.district.trim();
    if (!d.startsWith("อ.") && !d.startsWith("อำเภอ") && !d.startsWith("เขต")) {
      parts.push(`${isBkk ? "เขต" : "อ."}${d}`);
    } else {
      parts.push(d);
    }
  }

  if (addressData.province) {
    const p = addressData.province.trim();
    if (!isBkk && !p.startsWith("จ.") && !p.startsWith("จังหวัด")) {
      parts.push(`จ.${p}`);
    } else if (isBkk && !p.startsWith("กทม") && !p.startsWith("กรุงเทพ")) {
      parts.push(p);
    } else if (isBkk) {
      parts.push("กรุงเทพมหานคร");
    } else {
      parts.push(p);
    }
  }

  if (addressData.postalCode) {
    parts.push(addressData.postalCode.trim());
  }

  return parts.join(" ") || "-";
}

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
 * Build shipping address from customer
 */
export function buildCustomerShippingAddress(customer: {
  shippingAddressLine?: string | null;
  shippingSubdistrict?: string | null;
  shippingDistrict?: string | null;
  shippingProvince?: string | null;
  shippingPostalCode?: string | null;
}): string {
  return formatAddress({
    addressLine: customer.shippingAddressLine,
    subdistrict: customer.shippingSubdistrict,
    district: customer.shippingDistrict,
    province: customer.shippingProvince,
    postalCode: customer.shippingPostalCode,
  });
}

/**
 * Build company address
 */
export function buildCompanyAddress(company: {
  addressLine?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
}): string {
  return formatAddress({
    addressLine: company.addressLine,
    subdistrict: company.subdistrict,
    district: company.district,
    province: company.province,
    postalCode: company.postalCode,
  });
}

/**
 * Build full address (backward compatibility)
 */
export function buildFullAddress(
  addressLine?: string | null,
  subdistrict?: string | null,
  district?: string | null,
  province?: string | null,
  postalCode?: string | null,
): string {
  return formatAddress({
    addressLine,
    subdistrict,
    district,
    province,
    postalCode,
  });
}

/**
 * Clean prefix from address part
 */
export function cleanAddressPrefix(
  value: string | undefined | null,
  prefixes: string[],
): string {
  if (!value) return "";
  let cleaned = value;
  for (const prefix of prefixes) {
    cleaned = cleaned.replace(new RegExp(`^${prefix}`), "");
  }
  return cleaned.trim();
}
