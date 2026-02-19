"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/custom/form-components";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";

export interface ShippingAddressItem {
    addressLine: string;
    province: string;
    district: string;
    subdistrict: string;
    postalCode: string;
}

interface Props {
    value: ShippingAddressItem[];
    onChange: (value: ShippingAddressItem[]) => void;
}

export function ShippingAddressList({ value = [], onChange }: Props) {
    const handleAdd = () => {
        onChange([
            ...value,
            {
                addressLine: "",
                province: "",
                district: "",
                subdistrict: "",
                postalCode: "",
            },
        ]);
    };

    const handleRemove = (index: number) => {
        const next = [...value];
        next.splice(index, 1);
        onChange(next);
    };

    const handleChange = (index: number, field: keyof ShippingAddressItem, val: string) => {
        const next = [...value];
        next[index] = { ...next[index], [field]: val };
        onChange(next);
    };

    const handleAddressPickerChange = (index: number, val: any) => {
        const next = [...value];
        next[index] = {
            ...next[index],
            province: val.province,
            district: val.district,
            subdistrict: val.subdistrict,
            postalCode: val.postalCode,
        };
        onChange(next);
    };

    return (
        <div className="space-y-4">
            {value.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemove(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>

                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                        ที่อยู่จัดส่งลำดับที่ {index + 1}
                    </h4>

                    <FormInput
                        label="ที่อยู่จัดส่ง (บ้านเลขที่ หมู่ ซอย ถนน)"
                        placeholder="123/45 หมู่ 6"
                        value={item.addressLine}
                        onChange={(e) => handleChange(index, "addressLine", e.target.value)}
                        containerClassName="mb-4"
                    />

                    <ThaiAddressPicker
                        value={{
                            province: item.province,
                            district: item.district,
                            subdistrict: item.subdistrict,
                            postalCode: item.postalCode,
                        }}
                        onChange={(val) => handleAddressPickerChange(index, val)}
                    />
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={handleAdd}
                className="w-full border-dashed border-2 py-4 h-auto text-gray-500 hover:text-gray-700"
            >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มที่อยู่จัดส่ง
            </Button>
        </div>
    );
}
