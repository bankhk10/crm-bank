"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  CustomerFormDealer,
  CustomerFormSubdealer,
  CustomerFormFarmer,
  CustomerFormBroker,
  type CustomerType,
} from "@/modules/customers";
import { toast } from "sonner";
import { createCustomerAction } from "@/modules/customers/server/actions";

export default function CustomerNewView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedType] = useState<CustomerType | null>(() => {
    const t = searchParams?.get("type")?.toUpperCase();
    if (
      t === "DEALER" ||
      t === "SUBDEALER" ||
      t === "FARMER" ||
      t === "BROKER"
    ) {
      return t as CustomerType;
    }
    return null;
  });

  async function handleCreate(payload: any) {
    try {
      const res = await createCustomerAction(payload);
      return res;
    } catch (e: any) {
      return { success: false, error: String(e) };
    }
  }

  const typeLabels: Record<CustomerType, string> = {
    DEALER: "ตัวแทนจำหน่าย",
    SUBDEALER: "ตัวแทนจำหน่ายย่อย",
    FARMER: "เกษตรกร",
    BROKER: "นายหน้า",
  };

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">
              สร้าง{selectedType && `${typeLabels[selectedType]}`}
            </h5>
          </div>

          {!selectedType ? (
            <div>
              <p className="mb-4 text-center text-gray-600">
                กรุณาเลือกประเภทลูกค้าก่อน
              </p>
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push("/customers")}
                  className="px-4 py-2 bg-gray-500 text-white rounded-3xl"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedType === "DEALER" && (
                <CustomerFormDealer
                  onSubmit={async (payload: any) => {
                    const result = await handleCreate(payload);
                    if (result.success) {
                      toast.success("สร้างตัวแทนจำหน่ายเรียบร้อยแล้ว");
                      router.push("/customers");
                    }
                    return result;
                  }}
                  onCancel={() => router.push("/customers")}
                  submitLabel="บันทึก"
                />
              )}

              {selectedType === "SUBDEALER" && (
                <CustomerFormSubdealer
                  onSubmit={async (payload: any) => {
                    const result = await handleCreate(payload);
                    if (result.success) {
                      toast.success("สร้างตัวแทนจำหน่ายย่อยเรียบร้อยแล้ว");
                      router.push("/customers");
                    }
                    return result;
                  }}
                  onCancel={() => router.push("/customers")}
                  submitLabel="บันทึก"
                />
              )}

              {selectedType === "FARMER" && (
                <CustomerFormFarmer
                  onSubmit={async (payload: any) => {
                    const result = await handleCreate(payload);
                    if (result.success) {
                      toast.success("สร้างเกษตรกรเรียบร้อยแล้ว");
                      router.push("/customers");
                    }
                    return result;
                  }}
                  onCancel={() => router.push("/customers")}
                  submitLabel="บันทึก"
                />
              )}

              {selectedType === "BROKER" && (
                <CustomerFormBroker
                  onSubmit={async (payload: any) => {
                    const result = await handleCreate(payload);
                    if (result.success) {
                      toast.success("สร้างนายหน้าเรียบร้อยแล้ว");
                      router.push("/customers");
                    }
                    return result;
                  }}
                  onCancel={() => router.push("/customers")}
                  submitLabel="บันทึก"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
