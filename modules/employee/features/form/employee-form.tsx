"use client";

import React, { useEffect, useState, useMemo } from "react";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { FormInput, FormSelect } from "@/components/custom/form-components";
import FormActions from "@/components/custom/form-actions";
import DatePicker from "@/components/custom/DatePicker";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { employeeUpdateSchema, type EmployeeUpdateFormValues } from "@/modules/employee/application/validations";
import { PREFIX_OPTIONS, RESPONSIBILITY_AREA_OPTIONS, STATUS_OPTIONS } from "@/modules/employee/constants";
import { getCompaniesAction } from "@/modules/companies/server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import SignaturePad from "@/components/custom/SignaturePad";

import { calculateAge } from "@/lib/date-utils";

interface Props {
    employeeId?: string;
    initial?: Partial<EmployeeUpdateFormValues>;
    onSubmit: (payload: EmployeeUpdateFormValues) => Promise<{ success: boolean; error?: string; issues?: any }>;
    onCancel?: () => void;
    submitLabel?: string;
}

type Option = { value: string; label: string };

export default function EmployeeForm({
    employeeId,
    initial = {},
    onSubmit,
    onCancel,
    submitLabel = "บันทึก",
}: Props) {
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [roles, setRoles] = useState<Array<any>>([]);
    const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);
    const [positionOptions, setPositionOptions] = useState<Option[]>([]);
    const [managerOptions, setManagerOptions] = useState<Option[]>([]);

    const {
        control,
        handleSubmit,
        setValue,
        reset,
        formState: { isSubmitting, errors },
    } = useForm<EmployeeUpdateFormValues>({
        resolver: zodResolver(employeeUpdateSchema),
        defaultValues: {
            prefix: initial.prefix ?? "",
            firstName: initial.firstName ?? "",
            lastName: initial.lastName ?? "",
            employeeCode: initial.employeeCode ?? "",
            email: initial.email ?? "",
            phone: initial.phone ?? "",
            birthDate: initial.birthDate ?? "",
            position: initial.position ?? "",
            department: initial.department ?? "",
            company: initial.company ?? "",
            managerId: initial.managerId === null ? "none" : (initial.managerId ?? ""),
            responsibilityArea: initial.responsibilityArea ?? "",
            addressLine: initial.addressLine ?? "",
            province: initial.province ?? "",
            district: initial.district ?? "",
            subdistrict: initial.subdistrict ?? "",
            postalCode: initial.postalCode ?? "",
            roleDefinitionId: initial.roleDefinitionId ?? "",
            status: initial.status ?? "ACTIVE",
            signature: initial.signature ?? "",
            password: "",
        },
    });

    const [province, district, subdistrict, postalCode, birthDate] = useWatch({
        control,
        name: ["province", "district", "subdistrict", "postalCode", "birthDate"]
    });

    const calculatedAge = useMemo(() => calculateAge(birthDate), [birthDate]);

    useEffect(() => {
        let mounted = true;

        async function loadReferences() {
            try {
                const [rRes, cRes, dRes, pRes, mRes] = await Promise.all([
                    fetch("/api/rbac/roles").catch(() => null),
                    getCompaniesAction().catch(() => ({ companies: [] })),
                    fetch(`/api/rbac/departments`).catch(() => null),
                    fetch(`/api/rbac/positions`).catch(() => null),
                    getAllEmployeesAction().catch(() => ({ employees: [] })),
                ]);

                if (rRes?.ok && mounted) setRoles(await rRes.json());
                if (cRes?.companies && mounted) {
                    setCompanyOptions(cRes.companies.map((c: any) => ({ value: c.id, label: c.name })));
                }
                if (dRes?.ok && mounted) {
                    const d = await dRes.json();
                    setDepartmentOptions(d.map((x: any) => ({ value: x.id, label: x.name })));
                }
                if (pRes?.ok && mounted) {
                    const d = await pRes.json();
                    setPositionOptions(d.map((x: any) => ({ value: x.id, label: x.name })));
                }
                if (mRes?.employees && mounted) {
                    setManagerOptions([
                        { value: "none", label: "ไม่มี" },
                        ...mRes.employees
                            .filter((e: any) => e.id !== employeeId)
                            .map((e: any) => ({ value: e.id, label: e.name }))
                    ]);
                }
            } catch {
                // ignore
            }
        }

        loadReferences();
        return () => { mounted = false; };
    }, [employeeId]);


    async function handleFormSubmit(data: EmployeeUpdateFormValues) {
        if (!employeeId && !data.password) {
            setError("กรุณากรอกรหัสผ่านสำหรับพนักงานใหม่");
            return;
        }

        const payload = { ...data };
        if (payload.managerId === "none" || payload.managerId === "") {
            payload.managerId = null;
        }

        setError(null);
        try {
            const res = await onSubmit(payload);
            if (!res.success) {
                if (res.issues) {
                    setError(
                        Object.values(res.issues).flat()[0] as string ?? res.error ?? "เกิดข้อผิดพลาด"
                    );
                } else {
                    setError(res.error ?? "เกิดข้อผิดพลาด");
                }
            }
        } catch (error) {
            const err = error as Error;
            setError(err.message || String(err));
        }
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
            {error && (
                <div className="bg-destructive/15 text-destructive font-medium p-4 rounded-md border border-destructive/20">
                    {error}
                </div>
            )}

            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                ข้อมูลส่วนตัว
            </h3>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-6 mt-6">
                <Controller
                    control={control}
                    name="employeeCode"
                    render={({ field }) => (
                        <FormInput
                            label="รหัสพนักงาน"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.employeeCode?.message}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="prefix"
                    render={({ field }) => (
                        <FormSelect
                            label="คำนำหน้า"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={PREFIX_OPTIONS}
                            placeholder="เลือกคำนำหน้า"
                            error={errors.prefix?.message}
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="firstName"
                    render={({ field }) => (
                        <FormInput
                            label="ชื่อ"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            required
                            error={errors.firstName?.message}
                            containerClassName="md:col-span-2"
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="lastName"
                    render={({ field }) => (
                        <FormInput
                            label="นามสกุล"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            required
                            error={errors.lastName?.message}
                            containerClassName="md:col-span-2"
                        />
                    )}
                />
            </div>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-3">
                <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                        <FormInput
                            label="เบอร์โทรศัพท์"
                            value={field.value ?? ""}
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, "");
                                if (numericValue.length <= 10) field.onChange(numericValue);
                            }}
                            onBlur={field.onBlur}
                            error={errors.phone?.message}
                        />
                    )}
                />

                <div className="mt-0">
                    <Controller
                        control={control}
                        name="birthDate"
                        render={({ field }) => (
                            <DatePicker
                                label="วันเกิด"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder=""
                            />
                        )}
                    />
                </div>

                <FormInput
                    label="อายุ"
                    value={calculatedAge !== "" ? String(calculatedAge) : ""}
                    disabled
                    onChange={() => { }}
                />
            </div>

            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                ที่อยู่
            </h3>

            <Controller
                control={control}
                name="addressLine"
                render={({ field }) => (
                    <FormInput
                        label="ที่อยู่ (บ้านเลขที่, ถนน, ฯลฯ)"
                        placeholder="123/45 หมู่ 6"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.addressLine?.message}
                        containerClassName="md:col-span-2 mt-6"
                    />
                )}
            />

            <div className="md:col-span-2">
                <ThaiAddressPicker
                    value={{
                        province: province ?? "",
                        district: district ?? "",
                        subdistrict: subdistrict ?? "",
                        postalCode: postalCode ?? "",
                    }}
                    onChange={(next) => {
                        if (next.province !== undefined) setValue("province", next.province, { shouldValidate: true });
                        if (next.district !== undefined) setValue("district", next.district, { shouldValidate: true });
                        if (next.subdistrict !== undefined) setValue("subdistrict", next.subdistrict, { shouldValidate: true });
                        if (next.postalCode !== undefined) setValue("postalCode", String(next.postalCode), { shouldValidate: true });
                    }}
                />
            </div>

            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                ข้อมูลการทำงาน
            </h3>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 mt-6">
                <Controller
                    control={control}
                    name="position"
                    render={({ field }) => (
                        <FormSelect
                            label="ตำแหน่งงาน"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={positionOptions}
                            placeholder="เลือกตำแหน่ง"
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="department"
                    render={({ field }) => (
                        <FormSelect
                            label="แผนก"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={departmentOptions}
                            placeholder="เลือกแผนก"
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="company"
                    render={({ field }) => (
                        <FormSelect
                            label="สังกัดบริษัท"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={companyOptions}
                            placeholder="เลือกบริษัท"
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="responsibilityArea"
                    render={({ field }) => (
                        <FormSelect
                            label="เขตที่รับผิดชอบ"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={RESPONSIBILITY_AREA_OPTIONS}
                            placeholder="เลือกเขต"
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="managerId"
                    render={({ field }) => (
                        <FormSelect
                            label="หัวหน้างาน"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={managerOptions}
                            placeholder="เลือกหัวหน้างาน"
                        />
                    )}
                />
            </div>

            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                ข้อมูลการเข้าสู่ระบบ
            </h3>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
                <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                        <FormInput
                            label="อีเมลสำหรับเข้าสู่ระบบ"
                            type="email"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            required
                            error={errors.email?.message}
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                        <FormInput
                            label={
                                employeeId ? "รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"
                            }
                            type={showPassword ? "text" : "password"}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder={
                                employeeId
                                    ? "เว้นว่างหากไม่ต้องการเปลี่ยน"
                                    : "รหัสผ่านสำหรับเข้าสู่ระบบ"
                            }
                            required={!employeeId}
                            error={errors.password?.message}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none"
                                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            }
                            rightIconInteractive
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="roleDefinitionId"
                    render={({ field }) => (
                        <FormSelect
                            label="สิทธิ์การใช้งาน"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            options={roles.map((r: any) => ({ value: r.id, label: r.name }))}
                            placeholder="เลือกสิทธิ์การใช้งาน"
                            required
                            error={errors.roleDefinitionId?.message}
                        />
                    )}
                />

                <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                        <FormSelect
                            label="สถานะการทำงาน"
                            value={field.value ?? "ACTIVE"}
                            onChange={field.onChange}
                            options={STATUS_OPTIONS}
                            placeholder="เลือกสถานะ"
                        />
                    )}
                />
            </div>

            <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
                ลายเซ็นพนักงาน
            </h3>

            <div className="mt-6">
                <Controller
                    control={control}
                    name="signature"
                    render={({ field }) => (
                        <SignaturePad
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            error={errors.signature?.message}
                            maxWidth={400}
                            maxHeight={150}
                        />
                    )}
                />
            </div>

            <FormActions
                loading={isSubmitting}
                onCancel={onCancel}
                submitLabel={submitLabel}
            />

            <div className="w-full h-12 sm:hidden"></div>


        </form>
    );
}
