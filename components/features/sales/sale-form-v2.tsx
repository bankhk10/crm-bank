"use client";

/**
 * Sale Form V2
 * Refactored version of sale-form using modular components and hooks
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import DatePicker from "@/components/custom/DatePicker";
import {
  FormInput,
  FormSelect,
  FormCombobox,
  FormTextarea,
} from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";
import RandomFillButton from "@/components/custom/random-fill-button";
import generateRandomSaleClient from "@/lib/random-fill/sale-client";
import { useCurrentUser } from "@/hooks/use-current-user";

// New modular imports
import {
  DeliveryMethodSection,
  SaleItemRow,
  SaleSummary,
  ProductDetailModal,
  CustomerCreditInfo,
  SectionHeader,
  FormActionButtons,
} from "./components";
import {
  useSaleFormData,
  useSaleFormValidation,
  useSaleItems,
  isCreditBasedPayment,
  getCreditDaysForTerm,
} from "./hooks";
import {
  parseAddress,
  buildCustomerShippingAddress,
  buildCompanyAddress,
} from "./utils";
import type {
  SaleFormProps,
  SaleFormCustomer,
  SaleFormProduct,
  PaymentTermType,
  DeliveryMethodType,
} from "./types";

export function SaleFormV2({
  initialData,
  onSubmit,
  isEdit = false,
  onCancel,
}: SaleFormProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const isAdmin =
    currentUser?.roles?.includes("admin") ||
    currentUser?.roles?.includes("administrator") ||
    false;
  const isManager = currentUser?.roles?.includes("sales_manager") || false;
  const canSelectOtherEmployees = isAdmin || isManager;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load data using hook
  const { customers, employees, products, companies } = useSaleFormData();

  // Validation hook
  const { validateForm } = useSaleFormValidation();

  // Form state
  const [customerId, setCustomerId] = useState(initialData?.customerId || "");
  const [employeeId, setEmployeeId] = useState(
    initialData?.employeeId || (!isEdit ? currentUser?.employeeId : "") || "",
  );
  const [pickupCompanyId, setPickupCompanyId] = useState(
    initialData?.pickupCompanyId || "",
  );
  const [paymentTerm, setPaymentTerm] = useState<PaymentTermType>(
    initialData?.paymentTerm || "CREDIT_90",
  );
  const [creditDays, setCreditDays] = useState(initialData?.creditDays || 90);
  const [creditDueDate, setCreditDueDate] = useState(
    initialData?.creditDueDate || "",
  );
  const [saleDate, setSaleDate] = useState(
    initialData?.saleDate || new Date().toISOString().split("T")[0],
  );
  const [usePromotionalCredit, setUsePromotionalCredit] = useState(
    initialData?.usePromotionalCredit || false,
  );
  const [promotionalCreditUsed, setPromotionalCreditUsed] = useState(
    initialData?.promotionalCreditUsed || 0,
  );
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState(
    initialData?.requestedDeliveryDate || "",
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialData?.deliveryDate || "",
  );

  // Address state
  const [parsedBilling] = useState(() =>
    parseAddress(initialData?.billingAddress || ""),
  );
  const [billingAddress, setBillingAddress] = useState(
    initialData?.billingAddress || "",
  );
  const [billingStreet, setBillingStreet] = useState(parsedBilling.street);
  const [billingThaiAddress, setBillingThaiAddress] = useState(
    parsedBilling.thaiAddress,
  );
  const [shippingAddress, setShippingAddress] = useState(
    initialData?.shippingAddress || "",
  );
  const [useCustomShippingAddress, setUseCustomShippingAddress] = useState(
    () => {
      if (!initialData) return false;
      if (initialData.useCustomShipping === true) return true;
      const deliveryMethodValue = initialData.deliveryMethod;
      if (
        deliveryMethodValue === "COURIER" ||
        deliveryMethodValue === "CUSTOMER_PICKUP"
      ) {
        return true;
      }
      return false;
    },
  );
  const [customShippingAddress, setCustomShippingAddress] = useState(
    initialData?.shippingAddress || "",
  );
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodType>(
    initialData?.deliveryMethod || "SALES_DELIVERY",
  );

  // Discounts and notes
  const [shippingCost, setShippingCost] = useState(
    initialData?.shippingCost || 0,
  );
  const [otherCosts, setOtherCosts] = useState(initialData?.otherCosts || 0);
  const [otherCostsDescription, setOtherCostsDescription] = useState(
    initialData?.otherCostsDescription || "",
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Sale items using hook
  const { items, addItem, removeItem, updateItem, setItems, subtotal } =
    useSaleItems({
      initialItems: initialData?.items || [],
      products,
    });

  // Calculate total
  const total = subtotal - shippingCost - otherCosts;

  // Selected customer
  const [selectedCustomer, setSelectedCustomer] =
    useState<SaleFormCustomer | null>(null);

  // Product detail modal
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<SaleFormProduct | null>(null);

  // User permissions
  // User permissions (moved to top)

  // Auto-calculate credit due date
  useEffect(() => {
    if (saleDate && creditDays > 0) {
      const date = new Date(saleDate);
      date.setDate(date.getDate() + creditDays);
      setCreditDueDate(date.toISOString().split("T")[0]);
    } else {
      setCreditDueDate("");
    }
  }, [saleDate, creditDays]);

  // Auto-fill employeeId for current user (if they have an employeeId)
  useEffect(() => {
    if (!isEdit && !employeeId && currentUser?.employeeId) {
      setEmployeeId(currentUser.employeeId);
    }
  }, [currentUser, isEdit, employeeId]);

  // Update customer info when customer changes
  useEffect(() => {
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      setSelectedCustomer(customer || null);

      const isInitialCustomer = initialData?.customerId === customerId;
      const shouldUpdateAddress = customer && (!isEdit || !isInitialCustomer);

      if (shouldUpdateAddress) {
        setBillingAddress(customer.billingAddress || "");
        const parsedBill = parseAddress(customer.billingAddress || "");
        setBillingStreet(parsedBill.street);
        setBillingThaiAddress(parsedBill.thaiAddress);
        setShippingAddress(buildCustomerShippingAddress(customer));
      }
    }
  }, [customerId, customers, isEdit, initialData?.customerId]);

  // Combine billing address parts
  useEffect(() => {
    const parts = [
      billingStreet,
      billingThaiAddress.subdistrict
        ? `ตำบล${billingThaiAddress.subdistrict}`
        : "",
      billingThaiAddress.district ? `อำเภอ${billingThaiAddress.district}` : "",
      billingThaiAddress.province
        ? `จังหวัด${billingThaiAddress.province}`
        : "",
      billingThaiAddress.postalCode || "",
    ].filter(Boolean);
    if (parts.length > 0) {
      setBillingAddress(parts.join(" "));
    }
  }, [billingStreet, billingThaiAddress]);

  // Handle delivery method changes
  const [hasInitializedDeliveryMethod, setHasInitializedDeliveryMethod] =
    useState(false);

  useEffect(() => {
    if (deliveryMethod === "CUSTOMER_PICKUP") {
      if (pickupCompanyId) {
        const company = companies.find((c) => c.id === pickupCompanyId);
        if (company) {
          const fullAddress = buildCompanyAddress(company);
          setShippingAddress(fullAddress);
          setCustomShippingAddress(fullAddress);
          setUseCustomShippingAddress(true);
        }
      } else {
        setShippingAddress("");
        setCustomShippingAddress("");
        setUseCustomShippingAddress(true);
      }
    } else if (deliveryMethod === "COURIER") {
      setUseCustomShippingAddress(true);
      const wasInitiallyCourier = initialData?.deliveryMethod === "COURIER";
      if (pickupCompanyId && !wasInitiallyCourier) {
        setCustomShippingAddress("");
        setShippingAddress("");
        setPickupCompanyId("");
      } else if (pickupCompanyId && wasInitiallyCourier) {
        setPickupCompanyId("");
      }
    } else if (deliveryMethod === "SALES_DELIVERY" && selectedCustomer) {
      const isInitialCustomer = initialData?.customerId === customerId;
      const hadCustomShipping =
        isEdit && isInitialCustomer && initialData?.useCustomShipping === true;

      if (hadCustomShipping) {
        if (!hasInitializedDeliveryMethod) {
          setHasInitializedDeliveryMethod(true);
        }
        setPickupCompanyId("");
      } else if (!isEdit || !isInitialCustomer) {
        setUseCustomShippingAddress(false);
        setShippingAddress(buildCustomerShippingAddress(selectedCustomer));
        setPickupCompanyId("");
      }
    }
  }, [
    pickupCompanyId,
    deliveryMethod,
    companies,
    selectedCustomer,
    isEdit,
    initialData,
    customerId,
    hasInitializedDeliveryMethod,
  ]);

  // Handle payment term change
  const handlePaymentTermChange = (value: PaymentTermType) => {
    setPaymentTerm(value);
    setCreditDays(getCreditDaysForTerm(value));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setWarnings([]);
    setFieldErrors({});

    // Build state object for validation
    const formState = {
      customerId,
      employeeId,
      pickupCompanyId,
      paymentTerm,
      creditDays,
      creditDueDate,
      saleDate,
      usePromotionalCredit,
      promotionalCreditUsed,
      requestedDeliveryDate,
      deliveryDate,
      billingAddress,
      shippingAddress,
      useCustomShippingAddress,
      customShippingAddress,
      deliveryMethod,
      items,
      shippingCost,
      otherCosts,
      otherCostsDescription,
      notes,
    };

    // Validate
    const validation = validateForm(formState, {
      selectedCustomer,
      products,
      total,
    });

    setErrors(validation.errors);
    setWarnings(validation.warnings);
    setFieldErrors(validation.fieldErrors);

    if (validation.errors.length > 0) {
      return;
    }

    // Submit
    setLoading(true);
    try {
      const now = new Date();
      const saleDateWithTime = (() => {
        if (!saleDate) return saleDate;
        const [year, month, day] = saleDate.split("-").map(Number);
        const dateWithTime = new Date(
          year,
          month - 1,
          day,
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
        );
        return dateWithTime.toISOString();
      })();

      const isCreditPayment = isCreditBasedPayment(paymentTerm);

      await onSubmit({
        customerId,
        employeeId,
        paymentTerm,
        creditDays: isCreditPayment ? creditDays : undefined,
        creditDueDate: isCreditPayment ? creditDueDate : undefined,
        usePromotionalCredit,
        promotionalCreditUsed: usePromotionalCredit
          ? promotionalCreditUsed
          : undefined,
        saleDate: saleDateWithTime,
        requestedDeliveryDate: requestedDeliveryDate || undefined,
        deliveryDate: deliveryDate || undefined,
        billingAddress,
        shippingAddress:
          deliveryMethod === "COURIER"
            ? customShippingAddress
            : deliveryMethod === "SALES_DELIVERY"
              ? useCustomShippingAddress
                ? customShippingAddress
                : undefined
              : useCustomShippingAddress
                ? customShippingAddress
                : shippingAddress,
        useCustomShipping:
          deliveryMethod === "COURIER" ||
          (deliveryMethod === "SALES_DELIVERY" && useCustomShippingAddress),
        deliveryMethod,
        pickupCompanyId:
          deliveryMethod === "CUSTOMER_PICKUP" ? pickupCompanyId : undefined,
        items,
        shippingCost,
        otherCosts,
        otherCostsDescription,
        notes,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      setErrors([errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle random fill
  const handleRandomFill = () => {
    if (!customers.length || !employees.length || !products.length) return;
    const randomData = generateRandomSaleClient(customers, employees, products);

    setCustomerId(randomData.customerId);
    setEmployeeId(randomData.employeeId);
    setPaymentTerm(randomData.paymentTerm as PaymentTermType);
    if (randomData.creditDays) setCreditDays(randomData.creditDays);
    if (randomData.creditDueDate) setCreditDueDate(randomData.creditDueDate);
    setUsePromotionalCredit(randomData.usePromotionalCredit || false);
    setPromotionalCreditUsed(randomData.promotionalCreditUsed || 0);
    setSaleDate(randomData.saleDate);
    if (randomData.deliveryDate) setDeliveryDate(randomData.deliveryDate);
    if (randomData.requestedDeliveryDate)
      setRequestedDeliveryDate(randomData.requestedDeliveryDate);
    setItems(randomData.items);
    setShippingCost(randomData.shippingCost || 0);
    setOtherCosts(randomData.otherCosts || 0);
    setOtherCostsDescription(randomData.otherCostsDescription || "");
    setNotes(randomData.notes || "");
  };

  const handleCancel = onCancel ?? (() => router.back());

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[2000px] mx-auto space-y-4 sm:space-y-6 lg:space-y-8"
      noValidate
    >
      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert className="border-2 border-yellow-400 bg-yellow-50">
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {warnings.map((warning, i) => (
                <li key={i} className="text-sm sm:text-base text-yellow-800">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Customer & Employee Section */}
      <SectionHeader
        title="ข้อมูลลูกค้าและพนักงาน"
        color="gray"
        className="mt-6"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <FormCombobox
          label="ลูกค้า"
          value={customerId}
          onChange={(val) => {
            setCustomerId(val);
            setFieldErrors((prev) => ({ ...prev, customerId: "" }));
          }}
          options={customers.map((customer) => ({
            value: customer.id,
            label: `${customer.name} (${customer.customerCode})`,
          }))}
          placeholder="เลือกลูกค้า"
          searchPlaceholder="ค้นหาลูกค้า..."
          emptyText="ไม่พบลูกค้า"
          required
          error={fieldErrors.customerId}
        />

        <FormCombobox
          label="พนักงานขาย"
          value={employeeId}
          onChange={(val) => {
            setEmployeeId(val);
            setFieldErrors((prev) => ({ ...prev, employeeId: "" }));
          }}
          options={employees.map((employee) => ({
            value: employee.id,
            label: employee.name,
          }))}
          placeholder="เลือกพนักงานขาย"
          searchPlaceholder="ค้นหาพนักงานขาย..."
          emptyText="ไม่พบพนักงานขาย"
          disabled={!canSelectOtherEmployees}
          required
          error={fieldErrors.employeeId}
        />
      </div>

      {/* Credit Info */}
      {selectedCustomer && <CustomerCreditInfo customer={selectedCustomer} />}

      {/* Payment Terms Section */}
      <SectionHeader title="เงื่อนไขการชำระเงิน" color="gray" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <FormSelect
          label="เงื่อนไขการชำระเงิน"
          value={paymentTerm}
          onChange={(val) => handlePaymentTermChange(val as PaymentTermType)}
          options={[
            { value: "CREDIT_90", label: "ส่งสินค้าก่อน (เครดิต 90 วัน)" },
            { value: "CASH_7", label: "ชำระเงินสด (เครดิต 7 วัน)" },
            {
              value: "PREPAID",
              label: "ชำระเงินก่อนส่งสินค้า (โอนเงินก่อนส่งสินค้า)",
            },
            ...(isAdmin
              ? [
                  {
                    value: "CREDIT_OVER_90",
                    label: "ส่งสินค้าก่อน (เครดิตมากกว่า 90 วัน)",
                  },
                ]
              : []),
          ]}
          placeholder="เลือกเงื่อนไข"
          groupLabel="เงื่อนไข"
          required
        />

        {deliveryMethod !== "CUSTOMER_PICKUP" &&
          deliveryMethod !== "COURIER" && (
            <DatePicker
              label="วันที่ต้องการของ"
              value={requestedDeliveryDate}
              onChange={(val) => setRequestedDeliveryDate(val || "")}
              placeholder=""
            />
          )}

        <div>
          <DatePicker
            label="วันที่ขาย"
            value={saleDate}
            onChange={(val) => {
              setSaleDate(val || "");
              setFieldErrors((prev) => ({ ...prev, saleDate: "" }));
            }}
            placeholder=""
            disabled={!isAdmin}
            required
          />
          {fieldErrors.saleDate && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.saleDate}</p>
          )}
        </div>
      </div>

      {/* Delivery Section */}
      <SectionHeader title="การจัดส่งและที่อยู่" color="gray" />

      <DeliveryMethodSection
        value={deliveryMethod}
        onChange={setDeliveryMethod}
      />

      {/* Shipping Address based on delivery method */}
      <div className="mt-6">
        {deliveryMethod === "CUSTOMER_PICKUP" ? (
          <div className="space-y-4 border rounded-xl p-4">
            <h4 className="font-medium text-gray-900">
              รายละเอียดการรับสินค้า
            </h4>
            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
              <DatePicker
                label="วันที่มารับสินค้า"
                value={requestedDeliveryDate}
                onChange={(val) => setRequestedDeliveryDate(val || "")}
                placeholder="เลือกวันที่มารับสินค้า"
                required
              />

              <FormCombobox
                label="สถานที่รับสินค้า (บริษัท/สาขา)"
                value={pickupCompanyId}
                onChange={(val) => {
                  setPickupCompanyId(val);
                  setFieldErrors((prev) => ({ ...prev, pickupCompanyId: "" }));
                }}
                options={companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="เลือกสถานที่รับสินค้า"
                searchPlaceholder="ค้นหาสถานที่..."
                emptyText="ไม่พบสถานที่"
                required
                error={fieldErrors.pickupCompanyId}
              />

              <div className="md:col-span-2">
                <Label className="text-base font-medium mx-2 mb-2 block">
                  ที่อยู่สถานที่รับสินค้า
                </Label>
                <div className="p-3 bg-white border rounded-md min-h-[60px] text-gray-700">
                  {shippingAddress || "-"}
                </div>
              </div>
            </div>
          </div>
        ) : deliveryMethod === "COURIER" ? (
          <div className="space-y-4 border rounded-xl p-4">
            <h4 className="font-medium text-gray-900">
              รายละเอียดการจัดส่งผ่านบริษัทขนส่ง
            </h4>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-1">
              <div className="space-y-1">
                <DatePicker
                  label="วันที่ต้องการให้ส่งของ"
                  value={requestedDeliveryDate}
                  onChange={(val) => setRequestedDeliveryDate(val || "")}
                  placeholder="เลือกวันที่ต้องการส่งของ"
                />
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                  ⏰ หมายเหตุ สร้างรายการหลัง 12:00 น. → จัดส่งวันถัดไป
                </p>
              </div>

              <FormTextarea
                label="ที่อยู่สำหรับส่งให้บริษัทขนส่ง"
                value={customShippingAddress}
                onChange={(e) => {
                  setCustomShippingAddress(e.target.value);
                  setShippingAddress(e.target.value);
                  setFieldErrors((prev) => ({
                    ...prev,
                    customShippingAddress: "",
                  }));
                }}
                placeholder="ระบุรายละเอียดที่อยู่..."
                rows={4}
                required
                error={fieldErrors.customShippingAddress}
              />
            </div>
          </div>
        ) : selectedCustomer ? (
          <>
            {!useCustomShippingAddress && (
              <>
                {selectedCustomer.shippingAddressLine ||
                selectedCustomer.shippingProvince ? (
                  <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <FormInput
                        label="ที่อยู่จัดส่ง (บ้านเลขที่ หมู่ ซอย ถนน)"
                        value={selectedCustomer.shippingAddressLine || ""}
                        onChange={() => {}}
                        disabled
                        readOnly
                      />
                    </div>

                    <FormInput
                      label={
                        selectedCustomer.shippingProvince === "กรุงเทพมหานคร"
                          ? "แขวง"
                          : "ตำบล"
                      }
                      value={
                        selectedCustomer.shippingSubdistrict
                          ?.replace(/^แขวง/, "")
                          ?.replace(/^ตำบล/, "")
                          ?.trim() || ""
                      }
                      onChange={() => {}}
                      disabled
                      readOnly
                    />

                    <FormInput
                      label={
                        selectedCustomer.shippingProvince === "กรุงเทพมหานคร"
                          ? "เขต"
                          : "อำเภอ"
                      }
                      value={
                        selectedCustomer.shippingDistrict
                          ?.replace(/^เขต/, "")
                          ?.replace(/^อำเภอ/, "")
                          ?.trim() || ""
                      }
                      onChange={() => {}}
                      disabled
                      readOnly
                    />

                    <FormInput
                      label="จังหวัด"
                      value={
                        selectedCustomer.shippingProvince
                          ?.replace(/^จังหวัด/, "")
                          ?.trim() || ""
                      }
                      onChange={() => {}}
                      disabled
                      readOnly
                    />

                    <FormInput
                      label="รหัสไปรษณีย์"
                      value={selectedCustomer.shippingPostalCode || ""}
                      onChange={() => {}}
                      disabled
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-600">
                      ไม่พบข้อมูลที่อยู่จัดส่ง
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      ลูกค้ารายนี้ยังไม่มีข้อมูลที่อยู่จัดส่งในระบบ
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-600">
              กรุณาเลือกลูกค้า
            </p>
            <p className="mt-2 text-sm text-gray-500">
              เลือกลูกค้าเพื่อแสดงข้อมูลที่อยู่จัดส่ง
            </p>
          </div>
        )}

        {/* Custom shipping address option */}
        {selectedCustomer &&
          deliveryMethod !== "CUSTOMER_PICKUP" &&
          deliveryMethod !== "COURIER" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customShippingAddress"
                  checked={useCustomShippingAddress}
                  onCheckedChange={(checked) =>
                    setUseCustomShippingAddress(checked as boolean)
                  }
                />
                <label
                  htmlFor="customShippingAddress"
                  className="text-base font-medium cursor-pointer"
                >
                  ระบุที่อยู่จัดส่งสำหรับรายการขายนี้เท่านั้น
                </label>
              </div>

              {useCustomShippingAddress && (
                <FormTextarea
                  label="ที่อยู่จัดส่งสำหรับรายการนี้"
                  value={customShippingAddress}
                  onChange={(e) => setCustomShippingAddress(e.target.value)}
                  rows={4}
                  placeholder="กรอกที่อยู่จัดส่งสำหรับรายการขายนี้..."
                />
              )}
            </div>
          )}
      </div>

      {/* Products Section */}
      <SectionHeader title="รายการสินค้า" color="gray">
        <Button
          type="button"
          onClick={addItem}
          className="
          bg-emerald-600 hover:bg-emerald-700
          text-white font-semibold
          rounded-xl sm:rounded-lg
          px-4 sm:px-6 py-2 sm:py-2.5
          text-sm sm:text-sm
          shadow-sm hover:shadow-md
          transition-all duration-200
          w-full sm:w-auto
        "
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
          เพิ่มรายการ
        </Button>
      </SectionHeader>

      {fieldErrors.items && (
        <p className="text-sm text-red-600 mt-2">{fieldErrors.items}</p>
      )}

      <div className="space-y-4 mt-6">
        {items.map((item, index) => (
          <SaleItemRow
            key={index}
            item={item}
            index={index}
            products={products}
            onUpdate={updateItem}
            onRemove={removeItem}
            onShowDetails={setSelectedProductDetail}
            fieldError={fieldErrors[`item_${index}_productId`]}
            onClearError={() =>
              setFieldErrors((prev) => ({
                ...prev,
                [`item_${index}_productId`]: "",
              }))
            }
          />
        ))}
      </div>

      {/* Discounts Section */}
      <SectionHeader title="ส่วนลดและหมายเหตุ" color="gray" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <FormInput
          label="ส่วนลดค่าขนส่ง"
          type="number"
          value={String(shippingCost)}
          onChange={(e) => setShippingCost(Number(e.target.value))}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
        <FormInput
          label="ส่วนลดหน้าบิล"
          type="number"
          value={String(otherCosts)}
          onChange={(e) => setOtherCosts(Number(e.target.value))}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
      </div>

      {otherCosts > 0 && (
        <FormInput
          label="รายละเอียดส่วนลดหน้าบิล"
          value={otherCostsDescription}
          onChange={(e) => setOtherCostsDescription(e.target.value)}
        />
      )}

      <FormTextarea
        label="หมายเหตุ"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      {/* Summary Section */}
      <SectionHeader title="สรุปยอดรวม" color="gray" />

      <SaleSummary
        subtotal={subtotal}
        shippingCost={shippingCost}
        otherCosts={otherCosts}
        total={total}
      />

      {/* Action Buttons */}
      <FormActionButtons loading={loading} onCancel={handleCancel} />

      <div className="w-full h-12 sm:hidden"></div>

      <div className="w-full sm:w-auto">
        <RandomFillButton
          size="lg"
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-0 transition-colors"
          onClick={handleRandomFill}
          disabled={loading}
          variant="secondary"
        >
          <span className="mr-2">🎲</span> กรอกข้อมูลแบบสุ่ม
        </RandomFillButton>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
      />
    </form>
  );
}

export default SaleFormV2;
