"use client";

/**
 * Sale Form V2
 * Refactored version of sale-form using modular components and hooks
 */

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import DatePicker from "@/components/custom/DatePicker";
import {
    FormInput,
    FormSelect,
    FormCombobox,
    FormTextarea,
} from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "./forms";
import { useSaleFormData } from "./use-sale-form-data";
import {
    useSaleFormValidation,
    isCreditBasedPayment,
    getCreditDaysForTerm,
} from "./use-sale-form-validation";
import { useSaleItems } from "./use-sale-items";
import {
    parseAddress,
    buildCustomerShippingAddress,
    buildCompanyAddress,
} from "@/lib/address-utils";
import type {
    SaleFormProps,
    SaleFormCustomer,
    SaleFormProduct,
    PaymentTermType,
    DeliveryMethodType,
} from "../../types";

export function SaleForm({
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
    const isSaleAdmin = currentUser?.roles?.includes("sales_admin") || false;
    const canSelectOtherEmployees = isAdmin || isManager || isSaleAdmin;
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
    const [shippingCompanyId, setShippingCompanyId] = useState("");
    const [paymentTerm, setPaymentTerm] = useState<PaymentTermType>(
        initialData?.paymentTerm || "CREDIT_90",
    );
    const [creditDays, setCreditDays] = useState(initialData?.creditDays || 90);
    const [saleDate, setSaleDate] = useState(
        initialData?.saleDate || new Date().toISOString().split("T")[0],
    );
    const creditDueDate = useMemo(() => {
        if (saleDate && creditDays > 0) {
            const date = new Date(saleDate);
            date.setDate(date.getDate() + creditDays);
            return date.toISOString().split("T")[0];
        }
        return "";
    }, [saleDate, creditDays]);
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
    const [customShippingAddress, setCustomShippingAddress] = useState(
        initialData?.shippingAddress || "",
    );
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodType>(
        initialData?.deliveryMethod || "SALES_DELIVERY",
    );


    // Address selection state
    const [selectedAddressId, setSelectedAddressId] = useState<string>(
        initialData?.selectedAddressId || "",
    );
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



    // Auto-fill employeeId for current user (if they have an employeeId)
    useEffect(() => {
        if (!isEdit && !employeeId && currentUser?.employeeId) {
            const timer = setTimeout(() => {
                setEmployeeId(currentUser.employeeId || "");
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [currentUser, isEdit, employeeId]);

    // Helper to update customer details when customer changes
    const updateCustomerDetails = (newCustomerId: string) => {
        if (!newCustomerId) {
            setSelectedCustomer(null);
            return;
        }

        const customer = customers.find((c) => c.id === newCustomerId);
        setSelectedCustomer(customer || null);

        const isInitialCustomer = initialData?.customerId === newCustomerId;
        const shouldUpdateAddress = customer && (!isEdit || !isInitialCustomer);

        if (shouldUpdateAddress) {
            setBillingAddress(customer.billingAddress || "");
            const parsedBill = parseAddress(customer.billingAddress || "");
            setBillingStreet(parsedBill.street);
            setBillingThaiAddress(parsedBill.thaiAddress);
            setShippingAddress(buildCustomerShippingAddress(customer));
        }
    };

    // Initialize selectedCustomer on mount if needed
    useEffect(() => {
        if (customerId && !selectedCustomer) {
            const customer = customers.find((c) => c.id === customerId);
            if (customer) {
                const timer = setTimeout(() => {
                    setSelectedCustomer(customer);
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [customerId, customers, selectedCustomer]);

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
            const timer = setTimeout(() => {
                setBillingAddress(parts.join(" "));
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [billingStreet, billingThaiAddress]);

    // Handle delivery method changes
    const [hasInitializedDeliveryMethod, setHasInitializedDeliveryMethod] =
        useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (deliveryMethod === "CUSTOMER_PICKUP") {
            if (pickupCompanyId) {
                const company = companies.find((c) => c.id === pickupCompanyId);
                if (company) {
                    const fullAddress = buildCompanyAddress(company);
                    timer = setTimeout(() => {
                        setShippingAddress(fullAddress);
                        setCustomShippingAddress(fullAddress);
                    }, 0);
                }
            } else {
                timer = setTimeout(() => {
                    setShippingAddress("");
                    setCustomShippingAddress("");
                }, 0);
            }
        } else if (deliveryMethod === "COURIER") {
            timer = setTimeout(() => {
                const wasInitiallyCourier = initialData?.deliveryMethod === "COURIER";
                if (pickupCompanyId && !wasInitiallyCourier) {
                    setCustomShippingAddress("");
                    setShippingAddress("");
                    setPickupCompanyId("");
                    setShippingCompanyId("");
                } else if (pickupCompanyId && wasInitiallyCourier) {
                    setPickupCompanyId("");
                }
            }, 0);
        } else if (deliveryMethod === "SALES_DELIVERY" && selectedCustomer) {
            timer = setTimeout(() => {
                const isInitialCustomer = initialData?.customerId === customerId;
                const hadCustomShipping =
                    isEdit && isInitialCustomer && initialData?.useCustomShipping === true;

                if (hadCustomShipping) {
                    if (!hasInitializedDeliveryMethod) {
                        setHasInitializedDeliveryMethod(true);
                    }
                    setPickupCompanyId("");
                } else if (!isEdit || !isInitialCustomer) {
                    setShippingAddress(buildCustomerShippingAddress(selectedCustomer));
                    setPickupCompanyId("");
                }
            }, 0);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
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

    // Auto-select shipping company in edit mode if address matches
    useEffect(() => {
        if (
            deliveryMethod === "COURIER" &&
            selectedCustomer?.shippingCompanies &&
            !shippingCompanyId &&
            customShippingAddress
        ) {
            const matchingCompany = selectedCustomer.shippingCompanies.find((sc) => {
                const company = sc.shippingCompany;
                const structuredAddr = buildCompanyAddress({
                    addressLine: company.addressLine || undefined,
                    subdistrict: company.subdistrict || undefined,
                    district: company.district || undefined,
                    province: company.province || undefined,
                    postalCode: company.postalCode || undefined,
                });

                const fullAddress = structuredAddr || company.address || "";
                return fullAddress === customShippingAddress;
            });

            if (matchingCompany) {
                const timer = setTimeout(() => {
                    setShippingCompanyId(matchingCompany.shippingCompany.id);
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [deliveryMethod, selectedCustomer, shippingCompanyId, customShippingAddress]);

    // Handle payment term change
    const handlePaymentTermChange = (value: PaymentTermType) => {
        setPaymentTerm(value);
        setCreditDays(getCreditDaysForTerm(value));
    };

    const handleAddressSelect = (addressId: string, fullAddress: string) => {
        setSelectedAddressId(addressId);
        setShippingAddress(fullAddress);
        // Don't automatically set custom shipping address when selecting from list
        // setCustomShippingAddress(fullAddress);
        // setUseCustomShippingAddress(true);
    };

    // Handle custom address input
    const handleUseCustomAddress = () => {
        setSelectedAddressId("");
    };


    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

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
            customShippingAddress,
            deliveryMethod,
            shippingCompanyId,
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
                        ? customShippingAddress // Always use custom address for COURIER
                        : shippingAddress,
                useCustomShipping: deliveryMethod === "COURIER",
                deliveryMethod,
                selectedAddressId: selectedAddressId || undefined,
                pickupCompanyId:
                    deliveryMethod === "CUSTOMER_PICKUP" ? pickupCompanyId : undefined,
                shippingCompanyId:
                    deliveryMethod === "COURIER" ? shippingCompanyId : undefined,
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
            setLoading(false);
        }
    };

    // Handle random fill
    const handleRandomFill = () => {
        if (!customers.length || !employees.length || !products.length) return;
        const randomData = generateRandomSaleClient(customers, employees, products);

        setCustomerId(randomData.customerId);
        updateCustomerDetails(randomData.customerId);
        setEmployeeId(randomData.employeeId);
        setPaymentTerm(randomData.paymentTerm as PaymentTermType);
        if (randomData.creditDays) setCreditDays(randomData.creditDays);
        // creditDueDate is derived automatically
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
            {/* Errors */}
            {errors.length > 0 && (
                <Alert className="border-2 border-red-400 bg-red-50">
                    <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                            {errors.map((error, i) => (
                                <li key={i} className="text-sm sm:text-base text-red-800">
                                    {error}
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
                        updateCustomerDetails(val);
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
                        ...(isAdmin || isSaleAdmin
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
                        disabled={!isAdmin && !isSaleAdmin}
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
                customer={selectedCustomer}
                selectedAddressId={selectedAddressId}
                onAddressSelect={handleAddressSelect}
                onUseCustomAddress={handleUseCustomAddress}
                companies={companies}
                pickupCompanyId={pickupCompanyId}
                onPickupCompanyChange={(val) => {
                    setPickupCompanyId(val);
                    setFieldErrors((prev) => ({ ...prev, pickupCompanyId: "" }));
                }}
                shippingCompanyId={shippingCompanyId}
                onShippingCompanyChange={setShippingCompanyId}
                requestedDeliveryDate={requestedDeliveryDate}
                onRequestedDeliveryDateChange={setRequestedDeliveryDate}
                shippingAddress={shippingAddress}
                customShippingAddress={customShippingAddress}
                onCustomShippingAddressChange={setCustomShippingAddress}
                fieldErrors={fieldErrors}
                onFieldErrorClear={(field) => setFieldErrors((prev) => ({ ...prev, [field]: "" }))}
            />

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

export default SaleForm;
