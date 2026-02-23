"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import {
  CustomerFormDealer,
  CustomerFormSubdealer,
  CustomerFormFarmer,
  CustomerFormBroker,
} from "@/modules/customers";
import { getCustomerDetailAction, updateCustomerAction } from "@/modules/customers/server/actions";

export default function EditCustomerPage() {
  const { customerId } = useParams() as { customerId: string };
  const router = useRouter();
  const { hasPermission, isLoading } = usePermission("customer.edit");
  const canEdit = !isLoading && hasPermission("customer.edit");

  const [payload, setPayload] = useState<any>({
    customerCode: "",
    id: "",
    customerType: "DEALER",
    name: "",
    prefix: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    taxId: "",
    addressLine: "",
    province: "",
    district: "",
    subdistrict: "",
    postalCode: "",
    billingAddressLine: "",
    billingProvince: "",
    billingDistrict: "",
    billingSubdistrict: "",
    billingPostalCode: "",
    shippingAddressLine: "",
    shippingProvince: "",
    shippingDistrict: "",
    shippingSubdistrict: "",
    shippingPostalCode: "",
    status: "ACTIVE",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
    // SUBDEALER specific fields
    receiveFromDealer: "",
    mainCompetitor: "",
    areaCrops: "",
    averageMonthlyPurchase: "",
    mainProductSold: "",
    brandsSold: "",
    areaType: "",
    companyName: "",
    // FARMER specific fields
    farmPlots: [],
    // BROKER specific fields
    cropTypes: "",
    currentYield: "",
    farmerCount: "",
    plotCount: "",
    totalAreaRai: "",
    harvestPerYear: "",
    creditDays: "",
    chemicalValuePerCycle: "",
    chemicalQtyPerCycle: "",
    regularShops: "",
    serviceTypes: "",
    usedBrands: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const json = await getCustomerDetailAction(customerId);
        const src = json ?? {};
        if (mounted) {
          setPayload((prev: any) => ({
            id: src.id ?? customerId,
            ...prev,
            customerCode: src.customerCode ?? "",
            customerType: src.customerType ?? "DEALER",
            name: src.name ?? "",
            prefix: src.prefix ?? "",
            firstName: src.firstName ?? "",
            lastName: src.lastName ?? "",
            email: src.email ?? "",
            phone: src.phone ?? "",
            taxId: src.taxId ?? "",
            addressLine: src.addressLine ?? "",
            province: src.province ?? "",
            district: src.district ?? "",
            subdistrict: src.subdistrict ?? "",
            postalCode: src.postalCode ?? "",
            billingAddressLine: src.billingAddressLine ?? "",
            billingProvince: src.billingProvince ?? "",
            billingDistrict: src.billingDistrict ?? "",
            billingSubdistrict: src.billingSubdistrict ?? "",
            billingPostalCode: src.billingPostalCode ?? "",
            shippingAddressLine: src.shippingAddressLine ?? "",
            shippingProvince: src.shippingProvince ?? "",
            shippingDistrict: src.shippingDistrict ?? "",
            shippingSubdistrict: src.shippingSubdistrict ?? "",
            shippingPostalCode: src.shippingPostalCode ?? "",
            status: src.status ?? "ACTIVE",
            contactPerson: src.contactPerson ?? "",
            contactPhone: src.contactPhone ?? "",
            contactEmail: src.contactEmail ?? "",
            notes: src.notes ?? "",
            businessNotes: (src as any).businessNotes ?? src.notes ?? "",
            latitude: (src as any).latitude ?? "",
            longitude: (src as any).longitude ?? "",
            parentDealer: (src as any).parentDealerId ?? (src as any).parentDealer?.id ?? "",
            responsibleEmployeeId: (src as any).responsibleEmployeeId ?? null,
            relationshipScore: (src as any).relationshipScore ?? null,
            birthDate: (src as any).birthDate ?? "",
            // SUBDEALER specific fields
            receiveFromDealer: (src as any).receiveFromDealer ?? "",
            mainCompetitor: (src as any).mainCompetitor ?? "",
            areaCrops: (src as any).areaCrops ?? "",
            averageMonthlyPurchase: (src as any).averageMonthlyPurchase ?? "",
            mainProductSold: (src as any).mainProductSold ?? "",
            brandsSold: (src as any).brandsSold ?? "",
            areaType: (src as any).areaType ?? "",
            companyName: src.name ?? "",
            // FARMER specific fields
            farmPlots: (src as any).farmPlots ?? [
              {
                latitude: "",
                longitude: "",
                areaRai: "",
                cropType: "",
                variety: "",
                soilType: "",
                waterSource: "",
              },
            ],
            // BROKER specific fields
            cropTypes: (src as any).cropTypes ?? "",
            currentYield: (src as any).currentYield ?? "",
            farmerCount: (src as any).farmerCount ?? "",
            plotCount: (src as any).plotCount ?? "",
            totalAreaRai: (src as any).totalAreaRai ?? "",
            harvestPerYear: (src as any).harvestPerYear ?? "",
            creditDays: (src as any).creditDays ?? "",
            chemicalValuePerCycle: (src as any).chemicalValuePerCycle ?? "",
            chemicalQtyPerCycle: (src as any).chemicalQtyPerCycle ?? "",
            regularShops: (src as any).regularShops ?? "",
            serviceTypes: (src as any).serviceTypes ?? "",
            usedBrands: (src as any).usedBrands ?? "",
            images: ((src as any).images ?? []).map((img: any) => ({
              ...img,
              name: img.filename,
            })),
            shippingAddresses: src.addresses ?? [],
            contacts: src.contacts ?? [],
          }));
        }
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [customerId]);

  async function handleUpdate(payloadData: any) {
    if (!canEdit) return { success: false, error: "No permission" };
    setError(null);
    try {
      const res = await updateCustomerAction(customerId, payloadData);
      return res;
    } catch (e: any) {
      return { success: false, error: String(e) };
    }
  }

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl my-5 border-b pb-6">แก้ไขข้อมูลลูกค้า</h5>
          </div>

          {(!canEdit || error) && (
            <div>
              {!canEdit && (
                <Alert variant="destructive">
                  <AlertDescription>คุณไม่มีสิทธิ์แก้ไขลูกค้านี้</AlertDescription>
                </Alert>
              )}
              {error && (
                <div className="mt-3">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-2/5 bg-slate-200 rounded" />
              <div className="mt-4 h-4 w-3/5 bg-slate-200 rounded" />
            </div>
          ) : (
            <div>
              {payload.customerType === "DEALER" && (
                <CustomerFormDealer
                  initial={payload}
                  onSubmit={async (body: any) => {
                    const result = await handleUpdate(body);
                    return result;
                  }}
                  onCancel={() => router.push(`/customers`)}
                  submitLabel="บันทึก"
                  onSuccess={() => router.push(`/customers`)}
                />
              )}

              {payload.customerType === "SUBDEALER" && (
                <CustomerFormSubdealer
                  initial={payload}
                  onSubmit={async (body: any) => {
                    const result = await handleUpdate(body);
                    return result;
                  }}
                  onCancel={() => router.push(`/customers`)}
                  submitLabel="บันทึก"
                  onSuccess={() => router.push(`/customers`)}
                />
              )}

              {payload.customerType === "FARMER" && (
                <CustomerFormFarmer
                  initial={payload}
                  onSubmit={async (body: any) => {
                    const result = await handleUpdate(body);
                    return result;
                  }}
                  onCancel={() => router.push(`/customers`)}
                  submitLabel="บันทึก"
                  onSuccess={() => router.push(`/customers`)}
                />
              )}

              {payload.customerType === "BROKER" && (
                <CustomerFormBroker
                  initial={payload}
                  onSubmit={async (body: any) => {
                    const result = await handleUpdate(body);
                    return result;
                  }}
                  onCancel={() => router.push(`/customers`)}
                  submitLabel="บันทึก"
                  onSuccess={() => router.push(`/customers`)}
                />
              )}

              {/* Fallback to dealer form if type missing */}
              {!payload.customerType && (
                <CustomerFormDealer
                  initial={payload}
                  onSubmit={async (body: any) => {
                    const result = await handleUpdate(body);
                    return result;
                  }}
                  onCancel={() => router.push(`/customers`)}
                  submitLabel="บันทึก"
                  onSuccess={() => router.push(`/customers`)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
