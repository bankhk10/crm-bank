"use client";

import React from "react";
import { MapPin, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { SaleFormCustomer } from "../../_types/types";

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
  // Build full address string from address components
  const buildFullAddress = (address: CustomerAddress | null): string => {
    if (!address) return "";

    const parts = [
      address.addressLine,
      address.subdistrict,
      address.district,
      address.province,
      address.postalCode,
    ].filter(Boolean);

    return parts.join(" ");
  };

  // Get primary shipping address (single address from customer model)
  const primaryAddress = customer ? {
    addressLine: customer.shippingAddressLine,
    province: customer.shippingProvince,
    district: customer.shippingDistrict,
    subdistrict: customer.shippingSubdistrict,
    postalCode: customer.shippingPostalCode,
  } : null;

  // Combine primary address and additional addresses
  const allAddresses: Array<CustomerAddress & { isPrimary?: boolean }> = [];

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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUseCustomAddress}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              ระบุที่อยู่เอง
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">
        เลือกที่อยู่จัดส่ง <span className="text-red-500">*</span>
      </Label>

      <div className="space-y-2">
        {allAddresses.map((address) => {
          const fullAddress = buildFullAddress(address);
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
                      {address.isPrimary ? "ที่อยู่หลัก" : `ที่อยู่ที่ ${allAddresses.indexOf(address)}`}
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

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed border-2 py-3 h-auto text-gray-500 hover:text-gray-700"
          onClick={onUseCustomAddress}
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          ระบุที่อยู่อื่นๆ
        </Button>
      </div>
    </div>
  );
}

export default AddressSelector;
