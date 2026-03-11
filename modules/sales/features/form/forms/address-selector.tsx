"use client";

import React from "react";
import { MapPin, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { SaleFormCustomer } from "../../../types";
import { formatAddress } from "@/lib/address-utils";


interface CustomerAddress {
  id: string;
  addressLine?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AddressSelectorProps {
  customer: SaleFormCustomer | null;
  selectedAddressId?: string;
  onAddressSelect: (addressId: string, fullAddress: string) => void;
  onUseCustomAddress: () => void;
  disabled?: boolean;
}

export function AddressSelector({
  customer,
  selectedAddressId,
  onAddressSelect,
  onUseCustomAddress,
  disabled = false,
}: AddressSelectorProps) {

  // Get primary shipping address (single address from customer model)
  const primaryAddress = customer ? {
    addressLine: customer.shippingAddressLine,
    province: customer.shippingProvince,
    district: customer.shippingDistrict,
    subdistrict: customer.shippingSubdistrict,
    postalCode: customer.shippingPostalCode,
  } : null;

  // Combine primary address and additional addresses
  const allAddresses: Array<CustomerAddress & { isPrimary?: boolean; isSubDealer?: boolean; subDealerName?: string }> = [];

  // Add primary address first if it exists
  if (primaryAddress && (primaryAddress.addressLine || primaryAddress.province)) {
    allAddresses.push({
      id: "primary",
      addressLine: primaryAddress.addressLine,
      province: primaryAddress.province,
      district: primaryAddress.district,
      subdistrict: primaryAddress.subdistrict,
      postalCode: primaryAddress.postalCode,
      createdAt: "",
      updatedAt: "",
      isPrimary: true,
    });
  }

  // Add additional addresses
  if (customer?.addresses) {
    allAddresses.push(...customer.addresses);
  }

  // Add sub-dealer addresses (Child companies)
  if (customer?.subDealers) {
    customer.subDealers.forEach((subDealer) => {
      if (subDealer.shippingAddressLine || subDealer.shippingProvince) {
        allAddresses.push({
          id: `subdealer_${subDealer.id}_primary`,
          addressLine: subDealer.shippingAddressLine,
          province: subDealer.shippingProvince,
          district: subDealer.shippingDistrict,
          subdistrict: subDealer.shippingSubdistrict,
          postalCode: subDealer.shippingPostalCode,
          createdAt: "",
          updatedAt: "",
          isSubDealer: true,
          subDealerName: subDealer.name,
        });
      }
      if (subDealer.addresses && subDealer.addresses.length > 0) {
        subDealer.addresses.forEach((addr) => {
          allAddresses.push({
            ...addr,
            id: `subdealer_${subDealer.id}_${addr.id}`,
            isSubDealer: true,
            subDealerName: subDealer.name,
          });
        });
      }
    });
  }

  const hasAddresses = allAddresses.length > 0;

  if (!customer) {
    return (
      <div className="p-4 border rounded-xl bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>กรุณาเลือกลูกค้าก่อน</span>
        </div>
      </div>
    );
  }

  if (!hasAddresses) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          ที่อยู่จัดส่ง <span className="text-red-500">*</span>
        </Label>
        <div className="p-4 border rounded-xl bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>ไม่พบที่อยู่จัดส่ง</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-base mx-3">
        เลือกที่อยู่จัดส่งสินค้า <span className="text-red-500">*</span>
      </Label>

      <div className="space-y-2">
        {allAddresses.map((address) => {
          const fullAddress = formatAddress(address);
          const isSelected = selectedAddressId === address.id;

          return (
            <div
              key={address.id}
              onClick={() => onAddressSelect(address.id, fullAddress)}
              className={`p-4 border rounded-xl cursor-pointer transition-all
                ${isSelected
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                      ${isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {address.isPrimary
                        ? "ที่อยู่หลัก"
                        : address.isSubDealer
                          ? `ที่อยู่: ${address.subDealerName}`
                          : `ที่อยู่ที่ ${allAddresses.findIndex(a => !a.isSubDealer && a.id === address.id)}`}
                    </span>
                  </div>

                  <div className="text-gray-700 text-sm">
                    {fullAddress || "-"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AddressSelector;
