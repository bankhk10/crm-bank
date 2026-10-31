"use client";

import {
  getWorkTypeCode,
  getWorkTypeName,
  MARKETING_PRODUCT_CATEGORIES,
} from "@/modules/activity/constants";
import { createMockImageFile } from "./mock-image-helper";
import { saveTestSnapshot } from "./snapshot-storage";

export interface AutoFillUnplannedContext {
  targetWorkTypeCodes: string[];
  setSelectedWorkTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setTitle: (val: string) => void;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  setNotes: (val: string) => void;
  locationTeamHook: any;
  budgetHook: any;
  t1Form: any;
  t2Form: any;
  t3Form: any;
  t4Form: any;
  t5Form: any;
  t6Form: any;
  t7aForm: any;
  t7bForm: any;
  t8Form: any;
  t9Form: any;
  t10Form: any;
  t11Form: any;
  t12Form: any;
  t13Form: any;
  t14Form: any;
  masterData: {
    customers?: any[];
    farmerCustomers?: any[];
    products?: any[];
    demoPlots?: any[];
    followUpPlans?: any[];
    hattackFollowUpPlans?: any[];
    employees?: any[];
    planId?: string;
  };
}

export function autoFillUnplannedActivityForm(ctx: AutoFillUnplannedContext): {
  filledWorkTypes: string[];
  title: string;
} {
  const {
    targetWorkTypeCodes,
    setSelectedWorkTypes,
    setTitle,
    setStartDate,
    setEndDate,
    setNotes,
    locationTeamHook,
    budgetHook,
    masterData,
  } = ctx;

  const codes =
    targetWorkTypeCodes.length > 0
      ? targetWorkTypeCodes.map(getWorkTypeCode)
      : ["TYPE_1"];

  const labels: string[] = codes.map((c) => getWorkTypeName(c) || c);
  setSelectedWorkTypes(labels);

  const today = new Date().toISOString().split("T")[0];
  const codeText = codes.join("+");
  const testTitle = `[TEST-UNPLANNED] กิจกรรมนอกแผนทดสอบ ${codeText} (${new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })})`;
  const testNotes = `หมายเหตุทดสอบกิจกรรมนอกแผน (${codeText}) ครบทุกช่อง`;

  setTitle(testTitle);
  setStartDate(today);
  setEndDate(today);
  setNotes(testNotes);

  const dealers = (masterData.customers || []).filter(
    (c) => !c.customerType || c.customerType === "DEALER",
  );
  const firstDealer = dealers[0] || (masterData.customers || [])[0] || {
    id: "",
    name: "ร้านเกษตรเจริญรุ่งเรือง (นอกแผน)",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
  };
  const firstFarmer = (masterData.farmerCustomers || [])[0] || {
    id: "",
    name: "นายสมชาย ใจดี (เกษตรกรนอกแผน)",
    province: firstDealer.province || "เชียงใหม่",
    district: firstDealer.district || "เมืองเชียงใหม่",
  };
  const firstProduct = (masterData.products || [])[0] || {
    id: "",
    name: "ปืนใหญ่ โกลด์ 1000 ซีซี",
    unit: "ขวด",
    price: 450,
  };
  const firstDemoPlot = (masterData.demoPlots || [])[0] || null;
  const firstFollowUpPlan = (masterData.followUpPlans || [])[0] || null;
  const firstHattackPlan = (masterData.hattackFollowUpPlans || [])[0] || null;

  const province = firstDealer.province || "เชียงใหม่";
  const district = firstDealer.district || "เมืองเชียงใหม่";

  if (locationTeamHook) {
    locationTeamHook.setProvince(province);
    setTimeout(() => {
      locationTeamHook.setDistrict(district);
    }, 30);
    locationTeamHook.setLocationText(
      `พื้นที่ปฏิบัติงานนอกแผน อ.${district} จ.${province}`,
    );
  }

  if (budgetHook) {
    budgetHook.setIsPromotionalMediaSelected(true);
    budgetHook.setMarketingProductItems([
      {
        id: "mkt-unp-1",
        category: MARKETING_PRODUCT_CATEGORIES[0] || "Premium_item",
        productName: "หมวกแก๊ปตราปืนใหญ่ (นอกแผน)",
        quantityCases: 5,
        unit: "ใบ",
        pricePerCase: 80,
      },
    ]);
  }

  const snapshotFields: Record<
    string,
    { label: string; section: string; value: string }
  > = {
    title: {
      label: "ชื่อกิจกรรมนอกแผน",
      section: "Header",
      value: testTitle,
    },
    startDate: { label: "วันที่เริ่มต้น", section: "Header", value: today },
    endDate: { label: "วันที่สิ้นสุด", section: "Header", value: today },
    notes: { label: "หมายเหตุท้ายกิจกรรม", section: "Footer", value: testNotes },
  };

  // 1. TYPE_1
  if (codes.includes("TYPE_1")) {
    const img = createMockImageFile("UNPLANNED_TYPE1", 1);
    ctx.t1Form.setItems([
      {
        id: "unp-t1-1",
        visitPurpose: "DEALER",
        province,
        isUnregisteredFarmer: false,
        storeId: firstDealer.id || "",
        customerName: firstDealer.name,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
        topic: "แจ้งข่าวสาร",
        notes: "เข้าเยี่ยมด่วนนอกแผนตามคำขอของลูกค้า",
        discussionResult:
          "สรุปพูดคุยนอกแผนทดสอบ UI: ลูกค้าขอใบเสนอราคาสินค้าล็อตใหม่",
        productAdvice: "แนะนำอัตราการใช้ที่เหมาะสมกับสภาพอากาศ",
        advisedProducts: [firstProduct.name],
        salesOpportunity: "คาดว่าสั่งซื้อภายในสัปดาห์นี้ 15 ลัง",
        nextMeetingDate: today,
        farmerHomeAddress: "123 หมู่ 2",
        plotLatitude: "18.7883",
        plotLongitude: "98.9853",
        plotImages: [img],
      },
    ]);
    snapshotFields["unp.t1.customerName"] = {
      label: "ชื่อร้านค้า/เกษตรกร",
      section: "TYPE_1",
      value: firstDealer.name,
    };
  }

  // 2. TYPE_2
  if (codes.includes("TYPE_2")) {
    const img = createMockImageFile("UNPLANNED_TYPE2", 1);
    ctx.t2Form.setItems([
      {
        id: "unp-t2-1",
        visitPurpose: "DEALER",
        province,
        isUnregisteredFarmer: false,
        storeId: firstDealer.id || "",
        customerName: firstDealer.name,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
        notes: "แวะติดตามผลการใช้สินค้านอกแผน",
        products: [
          {
            id: "unp-t2-p1",
            productId: firstProduct.id || undefined,
            productName: firstProduct.name,
            notes: "ล็อตสั่งซื้อล่าสุด",
            usageResult: "ลูกค้าพึงพอใจ",
            followupDetail:
              "ผลการติดตามนอกแผนทดสอบ UI: ลูกค้ายืนยันคุณภาพสินค้าดีมาก",
            problemDetail: "",
          },
        ],
        images: [img],
      },
    ]);
    snapshotFields["unp.t2.customerName"] = {
      label: "ชื่อร้านค้า/เกษตรกร",
      section: "TYPE_2",
      value: firstDealer.name,
    };
  }

  // 3. TYPE_3
  if (codes.includes("TYPE_3")) {
    ctx.t3Form.setItems([
      {
        id: "unp-t3-1",
        storeId: firstDealer.id || "",
        storeName: firstDealer.name,
        dealerName: firstDealer.name,
        isSubDealer: false,
        isUnregisteredSubdealer: false,
        subdealerId: "",
        subdealerName: "",
        subDealerStore: "",
        notes: "เปิดบิลด่วนนอกแผน",
        products: [
          {
            id: "unp-t3-p1",
            productId: firstProduct.id || "",
            productName: firstProduct.name,
            targetQuantity: 10,
            actualQuantity: 10,
            unitPrice: 2400,
            actualTotal: 24000,
            unclosedReason: "",
            notes: "ปิดการขายนอกแผนสำเร็จ (ทดสอบ UI)",
          },
        ],
      },
    ]);
    snapshotFields["unp.t3.storeName"] = {
      label: "ชื่อร้านค้า",
      section: "TYPE_3",
      value: firstDealer.name,
    };
  }

  // 4. TYPE_4
  if (codes.includes("TYPE_4")) {
    const img = createMockImageFile("UNPLANNED_TYPE4", 1);
    ctx.t4Form.setItems([
      {
        id: "unp-t4-1",
        storeId: firstDealer.id || undefined,
        customerName: firstDealer.name,
        collectType: "COLLECT",
        targetAmount: 32000,
        receivedAmount: 32000,
        billingStatus: "วางบิลสำเร็จ",
        billingDetail: "วางบิลนอกแผนเรียบร้อย",
        collectDetail: "รับชำระค่าสินค้านอกแผนครบถ้วน (ทดสอบ UI)",
        notes: "หมายเหตุ TYPE_4 นอกแผน",
        images: [img],
      },
    ]);
    snapshotFields["unp.t4.customerName"] = {
      label: "ชื่อร้านค้า",
      section: "TYPE_4",
      value: firstDealer.name,
    };
  }

  // 5. TYPE_5
  if (codes.includes("TYPE_5")) {
    const bottleImg = createMockImageFile("UNPLANNED_TYPE5_BOTTLE", 1);
    const promoImg = createMockImageFile("UNPLANNED_TYPE5_PROMO", 2);
    ctx.t5Form.setItems([
      {
        id: "unp-t5-1",
        storeId: firstDealer.id || "",
        storeName: firstDealer.name,
        productId: firstProduct.id || "",
        comparedProduct: firstProduct.name,
        detail: "สำรวจพบโปรโมชั่นใหม่ของคู่แข่งหน้าร้าน",
        competitorBrand: "แบรนด์บี อะโกร (ทดสอบ UI)",
        competitorProduct: "บี-แมกซ์ 1000 ซีซี",
        posPrice: 500,
        dealerPrice: 410,
        subdealerPrice: 440,
        farmerPrice: 490,
        sellingPoints: "แถมเสื้อยืด 1 ตัวเมื่อซื้อครบ 6 ขวด",
        bottleImages: [bottleImg],
        promotionalImages: [promoImg],
      },
    ]);
    snapshotFields["unp.t5.storeName"] = {
      label: "ร้านค้าที่สำรวจ",
      section: "TYPE_5",
      value: firstDealer.name,
    };
  }

  // 6. TYPE_6
  if (codes.includes("TYPE_6")) {
    const img = createMockImageFile("UNPLANNED_TYPE6", 1);
    ctx.t6Form.setItems([
      {
        id: "unp-t6-1",
        isManualCustomer: false,
        storeId: firstDealer.id || null,
        customerName: firstDealer.name,
        manualCustomerName: "",
        manualCustomerAddress: "",
        manualCustomerPhone: "",
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "เข้าตรวจสอบปัญหาฉลากสินค้าลอกและเปลี่ยนขวดใหม่ให้เรียบร้อย (ทดสอบ UI)",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        productId: firstProduct.id || null,
        productName: firstProduct.name,
        lotNumber: "LOT-UNP-2026",
        status: "เสร็จสิ้น",
        images: [img],
      },
    ]);
    snapshotFields["unp.t6.customerName"] = {
      label: "ชื่อลูกค้า/ร้านค้า",
      section: "TYPE_6",
      value: firstDealer.name,
    };
  }

  // 7. TYPE_7B
  if (codes.includes("TYPE_7B")) {
    const cropImg = createMockImageFile("UNPLANNED_TYPE7B_CROP", 1);
    const roundImg = createMockImageFile("UNPLANNED_TYPE7B_ROUND", 1);
    const plotName =
      firstFollowUpPlan?.plotName ||
      firstDemoPlot?.name ||
      `แปลงสาธิตนอกแผน - ${firstFarmer.name}`;
    ctx.t7bForm.setItems([
      {
        id: "unp-t7b-1",
        sourceActivityPlanId: firstFollowUpPlan?.activityPlanId || null,
        sourceType7aTargetId: firstFollowUpPlan?.targetId || null,
        demoPlotId: firstFollowUpPlan?.demoPlotId || firstDemoPlot?.id || null,
        plotName,
        farmerName:
          firstFollowUpPlan?.farmerName ||
          firstDemoPlot?.farmerName ||
          firstFarmer.name,
        province: firstFollowUpPlan?.province || province,
        district: firstFollowUpPlan?.district || district,
        cropCategory: firstFollowUpPlan?.cropCategory || "นาข้าว",
        cropName: firstFollowUpPlan?.cropName || "ข้าวหอมมะลิ 105",
        areaRai: firstFollowUpPlan?.areaRai || 15,
        treeCount: null,
        dealerName: firstFollowUpPlan?.dealerName || firstDealer.name,
        visitDate: today,
        daysAfterSpray: 7,
        cropImages: [cropImg],
        photos: [cropImg],
        sprayingRounds: [
          {
            id: "unp-t7b-round-1",
            roundNumber: 1,
            sprayDate: today,
            sprayMethod: "SINGLE",
            sprayEquipment: "เป้สะพายหลัง",
            otherEquipment: "",
            productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
            problemDetail: "",
            baselineProducts: [],
            additionalProducts: [
              {
                id: "unp-t7b-prod-1",
                productId: firstProduct.id || "",
                productName: firstProduct.name,
                actualQuantity: 2,
                quantityUsed: 2,
                extraQuantity: "",
                extraUnit: "ซีซี",
                applicationRate: "50 ซีซี ต่อน้ำ 20 ลิตร",
                actualRate: "50 ซีซี ต่อน้ำ 20 ลิตร",
                unit: firstProduct.unit || "ขวด",
              },
            ],
            roundImages: [roundImg],
          },
        ],
        nextSprayDate: today,
        notes: "ติดตามแปลงสาธิตนอกแผนทดสอบ UI",
        plotStatus: "IN_PROGRESS",
        cropCondition: "สมบูรณ์",
        growthStage: "ระยะแตกกอ",
        productResponse: "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)",
        cropProblemDescription: "",
        sprayMethod: "SINGLE",
        sprayEquipment: "เป้สะพายหลัง",
        objective: "ติดตามผลแปลงสาธิตนอกแผน",
        hasProductWithdrawal: false,
        withdrawnProducts: [],
      },
    ]);
    snapshotFields["unp.t7b.plotName"] = {
      label: "ชื่อแปลงสาธิต",
      section: "TYPE_7B",
      value: plotName,
    };
  }

  // 8. TYPE_11
  if (codes.includes("TYPE_11")) {
    const stockImg = createMockImageFile("UNPLANNED_TYPE11_STOCK", 1);
    ctx.t11Form.setItems([
      {
        id: "unp-t11-1",
        storeId: firstDealer.id || null,
        storeName: firstDealer.name,
        stockItems: [
          {
            id: "unp-t11-si-1",
            storeId: firstDealer.id || null,
            storeName: firstDealer.name,
            productId: firstProduct.id || undefined,
            productName: firstProduct.name,
            remainingQty: "18 ลัง",
            stockStatus: "ปกติ",
            reorderOpportunity: "มีโอกาสสั่งเพิ่มในเดือนหน้า",
            remarks: "เช็คสต๊อกนอกแผนเรียบร้อย (ทดสอบ UI)",
          },
        ],
        nextAction: "แจ้งฝ่ายขายเตรียมส่งสินค้าเพิ่ม",
        remarks: "หมายเหตุเช็คสต๊อกนอกแผน",
        images: [stockImg],
      },
    ]);
    snapshotFields["unp.t11.storeName"] = {
      label: "ชื่อร้านค้าที่เช็คสต๊อก",
      section: "TYPE_11",
      value: firstDealer.name,
    };
  }

  // 9. TYPE_13
  if (codes.includes("TYPE_13")) {
    const afterImg = createMockImageFile("UNPLANNED_TYPE13_HATTACK", 1);
    ctx.t13Form.setItems([
      {
        id: "unp-t13-1",
        name: "แปลงที่ 1",
        plotName: "บ้านทุ่งเจริญ หมู่ 4 (แปลงแฮตแทคนอกแผน)",
        storeId: firstDealer.id || "",
        dealerName: firstDealer.name,
        province,
        district,
        subdistrict: "ตำบลแม่ยาว",
        village: "บ้านทุ่งเจริญ หมู่ 4",
        plannedPlotsCount: 4,
        actualPlotsCount: 4,
        objective: "ทำแปลงแฮตแทคนอกแผน",
        notes: "หมายเหตุ TYPE_13 นอกแผน",
        latitude: "18.8012",
        longitude: "98.9815",
        products: [
          {
            id: "unp-t13-p1",
            productId: firstProduct.id || "",
            productName: firstProduct.name,
            quantity: 4,
            actualQuantity: 4,
            quantityUsed: 4,
            unit: firstProduct.unit || "ขวด",
            applicationRate: "40 ซีซี ต่อน้ำ 20 ลิตร",
            actualRate: "40 ซีซี ต่อน้ำ 20 ลิตร",
          },
        ],
        images: [afterImg],
        afterSprayImages: [afterImg],
      },
    ]);
    snapshotFields["unp.t13.dealerName"] = {
      label: "ชื่อร้านค้าดีลเลอร์",
      section: "TYPE_13",
      value: firstDealer.name,
    };
  }

  // 10. TYPE_14
  if (codes.includes("TYPE_14")) {
    const afterImg = createMockImageFile("UNPLANNED_TYPE14_FOLLOWUP", 1);
    const hPlan = firstHattackPlan;
    const hTarget = hPlan?.targets?.[0] || hPlan?.plots?.[0];
    const plotName =
      hTarget?.plotName || "บ้านทุ่งเจริญ หมู่ 4 (ติดตามแฮตแทคนอกแผน)";
    ctx.t14Form.setItem({
      selectedHattackPlanId: hPlan?.id || "unp-hattack-plan-1",
      storeId: firstDealer.id || "",
      dealerName: firstDealer.name,
      province,
      district,
      actualPlotsCount: 4,
      images: [afterImg],
      plots: [
        {
          id: hTarget?.id || "unp-t14-plot-1",
          type13TargetId: hTarget?.id || undefined,
          demoPlotId: hTarget?.id || "unp-t14-plot-1",
          clientPlotId: "unp-t14-client-1",
          name: plotName,
          plotName,
          storeId: firstDealer.id || "",
          dealerName: firstDealer.name,
          province,
          district,
          subdistrict: hTarget?.subdistrict || "ตำบลแม่ยาว",
          village: hTarget?.village || "บ้านทุ่งเจริญ หมู่ 4",
          plannedPlotsCount: 4,
          actualPlotsCount: 4,
          daysAfterSpray: "7",
          trackingResult: "ได้ผลตามเกณฑ์",
          productResponse: "ปกติ",
          plotStatus: "IN_PROGRESS",
          closureNotes: "",
          additionalNotes: "ติดตามแปลงแฮตแทคนอกแผนทดสอบ UI",
          products: [
            {
              productId: firstProduct.id || "",
              productName: firstProduct.name,
              unit: firstProduct.unit || "ขวด",
              withdrawnQuantity: 4,
              actualQuantity: 4,
              quantityUsed: 4,
              extraQuantity: "",
              extraUnit: "ซีซี",
              actualRate: "40 ซีซี ต่อน้ำ 20 ลิตร",
            },
          ],
          afterSprayImages: [afterImg],
        },
      ],
    });
    snapshotFields["unp.t14.plotName"] = {
      label: "แปลงแฮตแทคที่ติดตาม",
      section: "TYPE_14",
      value: plotName,
    };
  }

  saveTestSnapshot({
    mode: "UNPLANNED",
    planId: masterData.planId,
    title: testTitle,
    workTypeCodes: codes,
    savedAt: new Date().toISOString(),
    fields: snapshotFields,
  });

  return {
    filledWorkTypes: codes,
    title: testTitle,
  };
}
