"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Save,
  Send,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import type { ActivityStatus } from "@prisma/client";

import { UnplannedHeader } from "./unplanned-header";
import { UnplannedWorkTypeSelector } from "./unplanned-work-type-selector";
import { UnplannedStoreCustomerSection } from "./unplanned-store-customer-section";
import {
  ActivityResultSection,
  ActivityStatusSection,
} from "@/modules/activity-plans/features/shared/actual-view/components";
import { DetailActivityResultSection } from "@/modules/activity-plans/features/shared/detail-view/components/detail-activity-result-section";
import {
  useActualStatusState,
} from "@/modules/activity-plans/features/shared/actual-view/hooks/use-actual-status-state";

import { useType1Actual } from "@/modules/activity-plans/features/type-1";
import { useType2Actual } from "@/modules/activity-plans/features/type-2";
import { useType3Actual } from "@/modules/activity-plans/features/type-3";
import { useType4Actual } from "@/modules/activity-plans/features/type-4";
import { useType5Actual } from "@/modules/activity-plans/features/type-5";
import { useType6Actual } from "@/modules/activity-plans/features/type-6";
import { useType7aActual } from "@/modules/activity-plans/features/type-7a";
import { useType7bActual } from "@/modules/activity-plans/features/type-7b";
import { useType8Actual } from "@/modules/activity-plans/features/type-8";
import { useType9Actual } from "@/modules/activity-plans/features/type-9";
import { useType10Actual } from "@/modules/activity-plans/features/type-10";
import { useType11Actual } from "@/modules/activity-plans/features/type-11";
import { useType13ActualState } from "@/modules/activity-plans/features/type-13";

import {
  buildResultSummary,
  deleteActivityPlanImagePaths,
} from "@/modules/activity-plans/features/shared/actual-view/utils";
import type {
  ActualTargetsState,
  ImageFile,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import {
  createUnplannedActivityAction,
  updateUnplannedActivityAction,
} from "@/modules/activity-plans/server/actions";
import type { UnplannedWorkTypeCode } from "../constants";

interface UnplannedFormProps {
  initialPlan?: any;
  customers: any[];
  products: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UnplannedForm({
  initialPlan,
  customers,
  products,
  onSuccess,
  onCancel,
}: UnplannedFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(initialPlan?.id);
  const planStatus = initialPlan?.status || "DRAFT";

  const isReadOnly =
    planStatus === "PENDING_REVIEW" ||
    planStatus === "REVIEWED";

  // 1. Basic Information State
  const initialDateStr = initialPlan?.startDate
    ? format(new Date(initialPlan.startDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const initialStartTimeStr = initialPlan?.startDate
    ? format(new Date(initialPlan.startDate), "HH:mm")
    : "09:00";

  const initialEndTimeStr = initialPlan?.endDate
    ? format(new Date(initialPlan.endDate), "HH:mm")
    : "12:00";

  const [activityDate, setActivityDate] = useState<string>(initialDateStr);
  const [startTime, setStartTime] = useState<string>(initialStartTimeStr);
  const [endTime, setEndTime] = useState<string>(initialEndTimeStr);

  // Work Type (Strictly 1–11 and 13)
  const initialWorkType = useMemo<UnplannedWorkTypeCode>(() => {
    if (initialPlan?.workTypes && initialPlan.workTypes.length > 0) {
      const code = getWorkTypeCode(
        initialPlan.workTypes[0].workTypeCode ||
          initialPlan.workTypes[0].activityType?.code,
      );
      if (code && code !== "TYPE_12" && code !== "TYPE_14") {
        return code as UnplannedWorkTypeCode;
      }
    }
    return "TYPE_1";
  }, [initialPlan]);

  const [selectedWorkType, setSelectedWorkType] =
    useState<UnplannedWorkTypeCode>(initialWorkType);

  // Store / Customer State
  const initialStore = initialPlan?.stores?.[0];
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialStore?.storeId || "",
  );
  const [isUnregisteredFarmer, setIsUnregisteredFarmer] = useState<boolean>(
    Boolean(initialStore?.isUnregisteredFarmer),
  );
  const [unregisteredFarmerName, setUnregisteredFarmerName] = useState<string>(
    initialStore?.unregisteredFarmerName || "",
  );
  const [unregisteredFarmerPhone, setUnregisteredFarmerPhone] =
    useState<string>(initialStore?.unregisteredFarmerPhone || "");

  const [province, setProvince] = useState<string>(
    initialPlan?.province || initialStore?.province || "",
  );
  const [district, setDistrict] = useState<string>(
    initialPlan?.district || "",
  );
  const [location, setLocation] = useState<string>(
    initialPlan?.location || "",
  );
  const [visitPurpose, setVisitPurpose] = useState<string>(
    initialPlan?.objective || initialStore?.visitPurpose || "",
  );

  // 2. Status Outcome State
  const statusState = useActualStatusState();

  // 3. TYPE Hooks
  const type1 = useType1Actual();
  const type2 = useType2Actual();
  const type3 = useType3Actual();
  const type4 = useType4Actual();
  const type5 = useType5Actual();
  const type6 = useType6Actual();
  const type7a = useType7aActual();
  const type7b = useType7bActual();
  const type8 = useType8Actual();
  const type9 = useType9Actual();
  const type10 = useType10Actual();
  const type11 = useType11Actual();
  const type13 = useType13ActualState();

  const typeHooks = useMemo(
    () => ({
      type1,
      type2,
      type3,
      type4,
      type5,
      type6,
      type7a,
      type7b,
      type8,
      type9,
      type10,
      type11,
      type13,
    }),
    [
      type1,
      type2,
      type3,
      type4,
      type5,
      type6,
      type7a,
      type7b,
      type8,
      type9,
      type10,
      type11,
      type13,
    ],
  );

  // 4. Hydration for Edit Mode
  useEffect(() => {
    if (!initialPlan) return;
    if (initialPlan.result) {
      statusState.hydrateStatus(initialPlan.result);
      type1.hydrate(initialPlan.result);
      type2.hydrate(initialPlan.result);
      type3.hydrate(initialPlan.result);
      type4.hydrate(initialPlan.result);
      type5.hydrate(initialPlan.result, {} as any);
      type6.hydrate(initialPlan.result);
      type7a.hydrate(initialPlan, initialPlan.result, {} as any);
      type7b.hydrate(initialPlan, initialPlan.result, {} as any);
      type8.hydrate(initialPlan.result);
      type9.hydrate(initialPlan.result);
      type10.hydrate(initialPlan.result);
      type11.hydrate(initialPlan.result);
      type13.hydrate(initialPlan, initialPlan.result, {} as any);
    }
  }, [initialPlan]);

  // Dynamic Customer Name derivation
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const customerName = useMemo(() => {
    if (selectedWorkType === "TYPE_1" && isUnregisteredFarmer) {
      return unregisteredFarmerName.trim();
    }
    return (
      selectedCustomer?.name ||
      initialStore?.storeName ||
      initialPlan?.title ||
      ""
    );
  }, [
    selectedWorkType,
    isUnregisteredFarmer,
    unregisteredFarmerName,
    selectedCustomer,
    initialStore,
    initialPlan,
  ]);

  // Adapter Targets (Strictly NO planned targets, target amounts, planned products)
  const adapterTargets = useMemo<ActualTargetsState>(() => {
    return {
      t1: {
        customer: customerName,
        topic: visitPurpose,
        detail: "",
        opportunity: "",
        nextDate: "",
      },
      t2: {
        product: "",
        customer: customerName,
        detail: visitPurpose,
        expectedResult: "",
        items: [],
      },
      t3: {
        product: "",
        customer: customerName,
        targetQty: "",
        targetSales: "",
        items: [],
      },
      t4: {
        customer: customerName,
        orderNo: "",
        targetCollect: "",
        items: [],
      },
      t5: {
        store: customerName,
        product: "",
        detail: visitPurpose,
        items: [],
      },
      t6: {
        customer: customerName,
        issueType: "",
        detail: visitPurpose,
        targetStatus: "",
        items: [],
      },
      t7: {
        owner: customerName,
        product: "",
        crop: "",
        plots: "",
        demoProductQuantity: "",
        objective: visitPurpose,
        experimentDetail: "",
        detail: "",
        targetCondition: "",
        items: [],
      },
      t8: {
        topic: visitPurpose,
        products: "",
        targetAttendees: "",
      },
      t9: {
        store: customerName,
        isSubDealer: false,
        subDealerStore: "",
        product: "",
        targetSales: "",
        targetAttendees: "",
        items: [],
      },
      t10: {
        attendees: "",
        targetSalesOrBooking: "",
        items: [],
      } as any,
      t11: {
        store: customerName,
        items: [],
      } as any,
    };
  }, [customerName, visitPurpose]);

  const isTypeVisible = useCallback(
    (typeTitleOrCode: string) => {
      const code = getWorkTypeCode(typeTitleOrCode);
      return code === selectedWorkType;
    },
    [selectedWorkType],
  );

  // Return comment from manager if RETURNED
  const returnedComment = useMemo(() => {
    if (initialPlan?.status !== "RETURNED") return null;
    const correctionLogs = (initialPlan?.approvalLogs || []).filter(
      (log: any) => log.action === "REQUEST_CORRECTION",
    );
    if (correctionLogs.length > 0) {
      return (
        correctionLogs[correctionLogs.length - 1].comment ||
        "กรุณาตรวจสอบและแก้ไขข้อมูล"
      );
    }
    return "กรุณาตรวจสอบและแก้ไขข้อมูล";
  }, [initialPlan]);

  const reviewerName = useMemo(() => {
    return (
      initialPlan?.currentApproverEmployee?.name ||
      initialPlan?.employee?.manager?.name ||
      null
    );
  }, [initialPlan]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Save Handler (Draft or Submit)
  const handleSave = async (submitImmediately: boolean) => {
    setFormError(null);

    // Validation
    if (!activityDate) {
      setFormError("กรุณาระบุวันที่จัดกิจกรรม");
      return;
    }
    if (!selectedWorkType) {
      setFormError("กรุณาเลือกประเภทกิจกรรมนอกแผนงาน");
      return;
    }
    if (selectedWorkType === "TYPE_1" && isUnregisteredFarmer) {
      if (!unregisteredFarmerName.trim()) {
        setFormError("กรุณาระบุชื่อเกษตรกร (ยังไม่ได้ลงทะเบียน)");
        return;
      }
    } else {
      if (!selectedCustomerId && !initialStore?.storeName) {
        setFormError("กรุณาเลือกร้านค้า / Key Farmer จากฐานข้อมูล");
        return;
      }
    }
    if (!province.trim()) {
      setFormError("กรุณาระบุจังหวัดที่ไปปฏิบัติงาน");
      return;
    }

    setIsSubmitting(true);
    const allNewlyUploadedUrls: string[] = [];

    try {
      // 1. Calculate Start and End ISO Dates
      const startDateTime = new Date(`${activityDate}T${startTime}:00`);
      const endDateTime = new Date(`${activityDate}T${endTime}:00`);

      const planTitle = `[นอกแผน] ${customerName || "กิจกรรมนอกแผนงาน"} (${selectedWorkType})`;

      // 2. Prepare Plan Stores payload
      const storePayload = [
        {
          workTypeCode: selectedWorkType,
          visitPurpose: visitPurpose.trim() || null,
          storeId: isUnregisteredFarmer ? null : (selectedCustomerId || null),
          storeName: customerName,
          province: province || null,
          isUnregisteredFarmer:
            selectedWorkType === "TYPE_1" ? isUnregisteredFarmer : false,
          unregisteredFarmerName:
            selectedWorkType === "TYPE_1" && isUnregisteredFarmer
              ? unregisteredFarmerName.trim()
              : null,
          unregisteredFarmerPhone:
            selectedWorkType === "TYPE_1" && isUnregisteredFarmer
              ? unregisteredFarmerPhone.trim()
              : null,
          targetAmount: null, // Strictly NO planned target
          remarks: null,
          notes: visitPurpose.trim() || null,
        },
      ];

      // 3. Collect TYPE Actual payloads
      // First, check if we have a planId for image uploading
      let targetPlanId = initialPlan?.id;

      // If create mode and we have images, create as DRAFT first to get ID
      if (!targetPlanId) {
        const createDraftRes = await createUnplannedActivityAction({
          title: planTitle,
          startDate: startDateTime,
          endDate: endDateTime,
          location: location || null,
          province: province || null,
          district: district || null,
          objective: visitPurpose.trim() || "กิจกรรมนอกแผนงาน",
          workTypeCodes: [selectedWorkType],
          planStores: storePayload,
          submitImmediately: false, // create initial record
        });

        if (!createDraftRes.success || !("plan" in createDraftRes) || !createDraftRes.plan) {
          throw new Error(
            createDraftRes.error || "เกิดข้อผิดพลาดในการบันทึกกิจกรรม",
          );
        }
        targetPlanId = (createDraftRes.plan as any).id;
      }

      // 4. Upload any new images using targetPlanId
      let cleanT1Images = type1.t1PlotImages;
      if (selectedWorkType === "TYPE_1") {
        cleanT1Images = await type1.uploadImages(
          targetPlanId,
          allNewlyUploadedUrls,
        );
      }

      let cleanT2Images = type2.t2Images;
      if (selectedWorkType === "TYPE_2") {
        cleanT2Images = await type2.uploadImages(
          targetPlanId,
          allNewlyUploadedUrls,
        );
      }

      let cleanT5Survey = type5.t5SurveyDetails;
      if (selectedWorkType === "TYPE_5") {
        cleanT5Survey = await type5.uploadImages(
          targetPlanId,
          allNewlyUploadedUrls,
        );
      }

      if (selectedWorkType === "TYPE_6") {
        const t6Err = type6.validate();
        if (t6Err) {
          setFormError(t6Err);
          setIsSubmitting(false);
          return;
        }
      }

      let cleanT6Images = type6.t6Images;
      if (selectedWorkType === "TYPE_6") {
        cleanT6Images = await type6.uploadImages(
          targetPlanId,
          allNewlyUploadedUrls,
        );
      }

      let cleanT7aInitial = type7a.t7InitialPhotos;
      if (selectedWorkType === "TYPE_7A") {
        cleanT7aInitial = await type7a.uploadImages(
          targetPlanId,
          "demo-plot",
          allNewlyUploadedUrls,
        );
      }

      let cleanT7bCrop = type7b.t7CropImages;
      let cleanT7bPlot = type7b.t7PlotImages;
      let cleanT7bRounds = type7b.t7bSprayingRounds;
      if (selectedWorkType === "TYPE_7B") {
        const res = await type7b.uploadImages(
          targetPlanId,
          "demo-plot",
          allNewlyUploadedUrls,
        );
        cleanT7bCrop = res.cleanCropImages;
        cleanT7bPlot = res.cleanPlotImages;
        cleanT7bRounds = res.cleanRounds;
      }

      let cleanT8Images = type8.t8Images;
      let cleanT8RegImages = type8.t8RegistrationImages;
      if (selectedWorkType === "TYPE_8") {
        const res = await type8.uploadImages(
          targetPlanId,
          allNewlyUploadedUrls,
        );
        cleanT8Images = res.cleanImages;
        cleanT8RegImages = res.cleanRegistrationImages;
      }

      let cleanT9Images = type9.t9Images;
      if (selectedWorkType === "TYPE_9") {
        cleanT9Images = await type9.uploadImages(
          targetPlanId,
          allNewlyUploadedUrls,
        );
      }

      let cleanT10Images = type10.t10Images;
      if (selectedWorkType === "TYPE_10") {
        cleanT10Images = await type10.uploadImages(
          targetPlanId,
          allNewlyUploadedUrls,
        );
      }

      // Collect payloads
      const t1Payload = type1.collectPayload(cleanT1Images);
      const t2Payload = type2.collectPayload(cleanT2Images);
      const t3Payload = type3.collectPayload();
      const t4Payload = type4.collectPayload();
      const t5Payload = type5.collectPayload(cleanT5Survey);
      const t6Payload = type6.collectPayload({
        isTypeVisible: true,
        products,
        customers,
        cleanImages: cleanT6Images,
      });
      const t7aPayload = type7a.collectPayload(cleanT7aInitial);
      const t7bPayload = type7b.collectPayload({
        cleanCropImages: cleanT7bCrop,
        cleanPlotImages: cleanT7bPlot,
        cleanRounds: cleanT7bRounds,
        products,
        targets: adapterTargets,
      });
      const t8Payload = type8.collectPayload(cleanT8Images, cleanT8RegImages);
      const t9Payload = type9.collectPayload(cleanT9Images);
      const t10Payload = type10.collectPayload(cleanT10Images);
      const t11Payload = type11.collectPayload();

      // Type 13
      let t13Payload: any = {};
      if (selectedWorkType === "TYPE_13") {
        t13Payload = type13.buildType13ActualPayload();
      }

      const activeT7Payload =
        selectedWorkType === "TYPE_7A" ? t7aPayload : t7bPayload;

      // 5. Build Result Summary
      const buildResult = buildResultSummary({
        activityResultStatus: statusState.activityResultStatus,
        cancelReason: statusState.cancelReason,
        postponedDate: statusState.postponedDate,
        postponedTime: statusState.postponedTime,
        postponedReason: statusState.postponedReason,
        postponedNotes: statusState.postponedNotes,
        planSummary: {
          planNo: initialPlan?.planNo || "UNPLANNED",
          title: planTitle,
          startDateStr: activityDate,
          endDateStr: activityDate,
          startTimeStr: startTime,
          endTimeStr: endTime,
          timeStr: `${startTime} - ${endTime} น.`,
          locationStr: [location, district, province].filter(Boolean).join(" "),
          province,
          district,
          objective: visitPurpose,
        },
        planWorkTypes: [selectedWorkType],
        products,
        ...t1Payload,
        ...t2Payload,
        ...t3Payload,
        ...t4Payload,
        ...t5Payload,
        ...t6Payload,
        ...activeT7Payload,
        ...t8Payload,
        ...t9Payload,
        ...t10Payload,
        ...t11Payload,
      });

      if (buildResult.validationError) {
        if (allNewlyUploadedUrls.length > 0) {
          await deleteActivityPlanImagePaths(
            targetPlanId,
            allNewlyUploadedUrls,
          );
        }
        setFormError(buildResult.validationError);
        setIsSubmitting(false);
        return;
      }

      const combinedActualResult = {
        ...buildResult.payload,
        actualStartDate: startDateTime,
        actualEndDate: endDateTime,
        resultStatus: statusState.activityResultStatus,
        ...(t13Payload.sprayRounds?.length
          ? {
              sprayRounds: [
                ...(buildResult.payload.sprayRounds || []),
                ...t13Payload.sprayRounds,
              ],
            }
          : {}),
        ...(t13Payload.type13PlotsActual?.length
          ? { type13PlotsActual: t13Payload.type13PlotsActual }
          : {}),
      };

      // 6. Final Update / Submit to Database
      const updateRes = await updateUnplannedActivityAction(targetPlanId, {
        title: planTitle,
        startDate: startDateTime,
        endDate: endDateTime,
        location: location || null,
        province: province || null,
        district: district || null,
        objective: visitPurpose.trim() || "กิจกรรมนอกแผนงาน",
        workTypeCodes: [selectedWorkType],
        planStores: storePayload,
        actualResult: combinedActualResult,
        submitImmediately,
      });

      if (!updateRes.success) {
        throw new Error(
          updateRes.error || "เกิดข้อผิดพลาดในการบันทึกกิจกรรมนอกแผนงาน",
        );
      }

      toast.success(
        submitImmediately
          ? "ส่งกิจกรรมนอกแผนงานเพื่อรอตรวจสอบเรียบร้อยแล้ว"
          : "บันทึกร่างกิจกรรมนอกแผนงานสำเร็จ",
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/activity-plans");
      }
    } catch (err: any) {
      console.error("Save unplanned activity error:", err);
      setFormError(err.message || "เกิดข้อผิดพลาดไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onCancel) onCancel();
    else router.push("/activity-plans");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <UnplannedHeader
        isEditMode={isEditMode}
        planNo={initialPlan?.planNo}
        status={initialPlan?.status}
        returnedComment={returnedComment}
        reviewerName={reviewerName}
        onBack={handleBack}
      />

      {/* Form Error Banner */}
      {formError && (
        <Alert variant="destructive" className="rounded-2xl shadow-xs">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-semibold text-sm">
            {formError}
          </AlertDescription>
        </Alert>
      )}

      {/* SECTION 1: Date & Time */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              วันและเวลาที่ปฏิบัติงานจริง
            </h3>
            <p className="text-xs text-slate-500">
              ระบุวันและช่วงเวลาที่จัดกิจกรรมนอกแผนงาน
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              วันที่ปฏิบัติงาน <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={activityDate}
              disabled={isReadOnly || isSubmitting}
              onChange={(e) => setActivityDate(e.target.value)}
              className="bg-white text-sm h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              เวลาเริ่มต้น
            </Label>
            <Input
              type="time"
              value={startTime}
              disabled={isReadOnly || isSubmitting}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-white text-sm h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              เวลาสิ้นสุด
            </Label>
            <Input
              type="time"
              value={endTime}
              disabled={isReadOnly || isSubmitting}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-white text-sm h-10"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Work Type Selector */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <UnplannedWorkTypeSelector
          selectedWorkType={selectedWorkType}
          onSelectWorkType={setSelectedWorkType}
          disabled={isReadOnly || isSubmitting}
        />
      </div>

      {/* SECTION 3: Store / Customer Section */}
      <UnplannedStoreCustomerSection
        workTypeCode={selectedWorkType}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(cust) => {
          setSelectedCustomerId(cust?.id || "");
        }}
        isUnregisteredFarmer={isUnregisteredFarmer}
        onToggleUnregisteredFarmer={setIsUnregisteredFarmer}
        unregisteredFarmerName={unregisteredFarmerName}
        onChangeUnregisteredFarmerName={setUnregisteredFarmerName}
        unregisteredFarmerPhone={unregisteredFarmerPhone}
        onChangeUnregisteredFarmerPhone={setUnregisteredFarmerPhone}
        province={province}
        onChangeProvince={setProvince}
        district={district}
        onChangeDistrict={setDistrict}
        location={location}
        onChangeLocation={setLocation}
        visitPurpose={visitPurpose}
        onChangeVisitPurpose={setVisitPurpose}
        disabled={isReadOnly || isSubmitting}
      />

      {/* SECTION 4: Actual Result Recording / Display */}
      {isReadOnly ? (
        <DetailActivityResultSection
          isTypeVisible={isTypeVisible}
          targets={adapterTargets}
          parsedResults={initialPlan?.result || ({} as any)}
        />
      ) : (
        <div className="space-y-6">
          <ActivityResultSection
            isTypeVisible={isTypeVisible}
            targets={adapterTargets}
            products={products}
            customers={customers}
            planProvince={province}
            typeHooks={typeHooks}
          />

          <ActivityStatusSection
            activityResultStatus={statusState.activityResultStatus}
            setActivityResultStatus={statusState.setActivityResultStatus}
            cancelReason={statusState.cancelReason}
            setCancelReason={statusState.setCancelReason}
            postponedDate={statusState.postponedDate}
            setPostponedDate={statusState.setPostponedDate}
            postponedTime={statusState.postponedTime}
            setPostponedTime={statusState.setPostponedTime}
            postponedReason={statusState.postponedReason}
            setPostponedReason={statusState.setPostponedReason}
            postponedNotes={statusState.postponedNotes}
            setPostponedNotes={statusState.setPostponedNotes}
          />
        </div>
      )}

      {/* SECTION 5: Action Buttons */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto font-semibold border-slate-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้ารายการ
        </Button>

        {!isReadOnly && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2 text-slate-500" />
              )}
              บันทึกร่าง
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {initialPlan?.status === "RETURNED"
                ? "ส่งตรวจสอบใหม่"
                : "ส่งตรวจสอบ"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
