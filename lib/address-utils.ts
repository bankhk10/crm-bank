export interface AddressData {
  addressLine?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
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
