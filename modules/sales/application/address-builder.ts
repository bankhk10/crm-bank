import { db } from "@/lib/db";
import { parseAddress } from "@/lib/address-utils";
import type { SaleFormData } from "@/modules/sales/types";

/**
 * Extract exploded address fields from the given SaleFormData and related db entities,
 * returning an object that perfectly matches the new SaleAddress snapshot fields.
 */
export async function buildExplodedSaleAddresses(
  body: SaleFormData,
  customer: any,
) {
  const addresses: Record<string, string | null> = {
    company_name: null,
    company_phone: null,
    address_line: null,
    address_province: null,
    address_district: null,
    address_subdistrict: null,
    address_code: null,
    company_note: null,

    billing_address_line: customer?.billingAddressLine || null,
    billing_province: customer?.billingProvince || null,
    billing_district: customer?.billingDistrict || null,
    billing_subdistrict: customer?.billingSubdistrict || null,
    billing_postal_code: customer?.billingPostalCode || null,
    billing_note: null,

    shipping_address_line: null,
    shipping_province: null,
    shipping_district: null,
    shipping_subdistrict: null,
    shipping_postal_code: null,
    shipping_note: null,

    receiving_name: null,
    receiving_phone: null,
    receiving_address_line: null,
    receiving_province: null,
    receiving_district: null,
    receiving_subdistrict: null,
    receiving_postal_code: null,
    receiving_note: null,

    sender_name: null,
    sender_phone: null,
    sender_line: null,
    sender_province: null,
    sender_district: null,
    sender_subdistrict: null,
    sender_postal_code: null,
    sender_note: null,
  };

  // 1. Customer Address Snapshot (Stored in company_* fields per Prisma schema)
  if (customer) {
    addresses.company_name = customer.name || null;
    addresses.company_phone = customer.phone || null;
    addresses.address_line = customer.addressLine || null;
    addresses.address_province = customer.province || null;
    addresses.address_district = customer.district || null;
    addresses.address_subdistrict = customer.subdistrict || null;
    addresses.address_code = customer.postalCode || null;
  }

  // 2. Billing: the UI allows them to pass a fully composed `billingAddress` string
  if (body.billingAddress) {
    const parsed = parseAddress(body.billingAddress);
    addresses.billing_address_line =
      parsed.street || addresses.billing_address_line;
    addresses.billing_province =
      parsed.thaiAddress.province || addresses.billing_province;
    addresses.billing_district =
      parsed.thaiAddress.district || addresses.billing_district;
    addresses.billing_subdistrict =
      parsed.thaiAddress.subdistrict || addresses.billing_subdistrict;
    addresses.billing_postal_code =
      parsed.thaiAddress.postalCode || addresses.billing_postal_code;
  }

  // 3. Shipping Address
  if (
    body.deliveryMethod === "SALES_DELIVERY" ||
    body.deliveryMethod === "FACTORY_DELIVERY"
  ) {
    if (body.useCustomShipping && body.shippingAddress) {
      const parsed = parseAddress(body.shippingAddress);
      addresses.shipping_address_line = parsed.street;
      addresses.shipping_province = parsed.thaiAddress.province || null;
      addresses.shipping_district = parsed.thaiAddress.district || null;
      addresses.shipping_subdistrict = parsed.thaiAddress.subdistrict || null;
      addresses.shipping_postal_code = parsed.thaiAddress.postalCode || null;
    } else if (body.selectedAddressId) {
      const addressId = body.selectedAddressId;

      if (addressId === "primary") {
        // ที่อยู่หลักของลูกค้า
        if (customer) {
          addresses.shipping_address_line = customer.shippingAddressLine;
          addresses.shipping_province = customer.shippingProvince;
          addresses.shipping_district = customer.shippingDistrict;
          addresses.shipping_subdistrict = customer.shippingSubdistrict;
          addresses.shipping_postal_code = customer.shippingPostalCode;
        }
      } else if (addressId.startsWith("subdealer_")) {
        // รูปแบบ: "subdealer_{customerId}_primary" หรือ "subdealer_{customerId}_{addressId}"
        const parts = addressId.split("_");
        // parts[0] = "subdealer", parts[1] = customerId, parts[2] = "primary" หรือ addressId
        const subDealerId = parts[1];
        const addrPart = parts.slice(2).join("_");

        if (addrPart === "primary") {
          // ดึงที่อยู่หลักของร้านลูก (shippingAddress fields ใน Customer)
          const subDealer = await db.customer.findUnique({
            where: { id: subDealerId },
            select: {
              shippingAddressLine: true,
              shippingProvince: true,
              shippingDistrict: true,
              shippingSubdistrict: true,
              shippingPostalCode: true,
            },
          });
          if (subDealer) {
            addresses.shipping_address_line = subDealer.shippingAddressLine;
            addresses.shipping_province = subDealer.shippingProvince;
            addresses.shipping_district = subDealer.shippingDistrict;
            addresses.shipping_subdistrict = subDealer.shippingSubdistrict;
            addresses.shipping_postal_code = subDealer.shippingPostalCode;
          }
        } else {
          // ดึงที่อยู่เพิ่มเติมของร้านลูกจาก CustomerAddress
          const custAddr = await db.customerAddress.findUnique({
            where: { id: addrPart },
          });
          if (custAddr) {
            addresses.shipping_address_line = custAddr.addressLine;
            addresses.shipping_province = custAddr.province;
            addresses.shipping_district = custAddr.district;
            addresses.shipping_subdistrict = custAddr.subdistrict;
            addresses.shipping_postal_code = custAddr.postalCode;
          }
        }
      } else {
        // ที่อยู่เพิ่มเติมของลูกค้าหลัก (CustomerAddress id จริง)
        const custAddr = await db.customerAddress.findUnique({
          where: { id: addressId },
        });
        if (custAddr) {
          addresses.shipping_address_line = custAddr.addressLine;
          addresses.shipping_province = custAddr.province;
          addresses.shipping_district = custAddr.district;
          addresses.shipping_subdistrict = custAddr.subdistrict;
          addresses.shipping_postal_code = custAddr.postalCode;
        }
      }
    } else if (customer) {
      addresses.shipping_address_line = customer.shippingAddressLine;
      addresses.shipping_province = customer.shippingProvince;
      addresses.shipping_district = customer.shippingDistrict;
      addresses.shipping_subdistrict = customer.shippingSubdistrict;
      addresses.shipping_postal_code = customer.shippingPostalCode;
    }
  }

  // 4. Receiving Address (Pickup)
  if (body.deliveryMethod === "CUSTOMER_PICKUP") {
    if (body.pickupCompanyId) {
      const pickupCompany = await db.company.findUnique({
        where: { id: body.pickupCompanyId },
      });
      if (pickupCompany) {
        addresses.receiving_name = pickupCompany.name;
        addresses.receiving_phone = pickupCompany.phone;
        addresses.receiving_address_line = pickupCompany.addressLine;
        addresses.receiving_province = pickupCompany.province;
        addresses.receiving_district = pickupCompany.district;
        addresses.receiving_subdistrict = pickupCompany.subdistrict;
        addresses.receiving_postal_code = pickupCompany.postalCode;
      }
    } else if (body.shippingAddress) {
      // Fallback to text parsed Custom Shipping Address for pickup
      const parsed = parseAddress(body.shippingAddress);
      addresses.receiving_address_line = parsed.street;
      addresses.receiving_province = parsed.thaiAddress.province || null;
      addresses.receiving_district = parsed.thaiAddress.district || null;
      addresses.receiving_subdistrict = parsed.thaiAddress.subdistrict || null;
      addresses.receiving_postal_code = parsed.thaiAddress.postalCode || null;
    }
  }

  // 5. Sender Address (Courier)
  if (body.deliveryMethod === "COURIER") {
    if (body.shippingCompanyId) {
      const shippingCompany = await db.shippingCompany.findUnique({
        where: { id: body.shippingCompanyId },
      });
      if (shippingCompany) {
        addresses.sender_name = shippingCompany.name;
        addresses.sender_phone = shippingCompany.phone;
        addresses.sender_line = shippingCompany.addressLine;
        addresses.sender_province = shippingCompany.province;
        addresses.sender_district = shippingCompany.district;
        addresses.sender_subdistrict = shippingCompany.subdistrict;
        addresses.sender_postal_code = shippingCompany.postalCode;
      }
    } else if (body.shippingAddress) {
      // Fallback to text parsed Custom Shipping Address for courier
      const parsed = parseAddress(body.shippingAddress);
      addresses.sender_line = parsed.street;
      addresses.sender_province = parsed.thaiAddress.province || null;
      addresses.sender_district = parsed.thaiAddress.district || null;
      addresses.sender_subdistrict = parsed.thaiAddress.subdistrict || null;
      addresses.sender_postal_code = parsed.thaiAddress.postalCode || null;
    }
  }

  return addresses;
}
