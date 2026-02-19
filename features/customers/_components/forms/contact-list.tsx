"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/custom/form-components";

export interface ContactItem {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

interface Props {
    value: ContactItem[];
    onChange: (value: ContactItem[]) => void;
}

export function ContactList({ value = [], onChange }: Props) {
    const handleAdd = () => {
        onChange([
            ...value,
            {
                firstName: "",
                lastName: "",
                phone: "",
                email: "",
            },
        ]);
    };

    const handleRemove = (index: number) => {
        const next = [...value];
        next.splice(index, 1);
        onChange(next);
    };

    const handleChange = (index: number, field: keyof ContactItem, val: string) => {
        const next = [...value];
        next[index] = { ...next[index], [field]: val };
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
                        ข้อมูลผู้ติดต่อ ลำดับที่ {index + 1}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                            label="ชื่อ"
                            placeholder="สมชาย"
                            value={item.firstName}
                            onChange={(e) => handleChange(index, "firstName", e.target.value)}
                        />
                        <FormInput
                            label="นามสกุล"
                            placeholder="ใจดี"
                            value={item.lastName}
                            onChange={(e) => handleChange(index, "lastName", e.target.value)}
                        />
                        <FormInput
                            label="เบอร์โทรศัพท์"
                            placeholder="0812345678"
                            value={item.phone}
                            onChange={(e) => handleChange(index, "phone", e.target.value)}
                        />
                        <FormInput
                            label="อีเมล"
                            placeholder="example@test.com"
                            value={item.email}
                            onChange={(e) => handleChange(index, "email", e.target.value)}
                        />
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={handleAdd}
                className="w-full border-dashed border-2 py-4 h-auto text-gray-500 hover:text-gray-700"
            >
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มผู้ติดต่อ
            </Button>
        </div>
    );
}
