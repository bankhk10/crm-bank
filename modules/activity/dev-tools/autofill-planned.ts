"use client";

import {
  getWorkTypeCode,
  getWorkTypeName,
  MARKETING_PRODUCT_CATEGORIES,
} from "@/modules/activity/constants";
import { saveTestSnapshot } from "./snapshot-storage";

export interface AutoFillPlannedContext {
  targetWorkTypeCodes: string[];
  setSelectedWorkTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setTitle: (val: string) => void;
  setStartDate: (val: string) => void;
  setEndDate: (val: string) => void;
  setNotes: (val: string) => void;
  locationTeamHook: any;
  budgetHook: any;
  type1Form: any;
  type2Form: any;
  type3Form: any;
  type4Form: any;
  type5Form: any;
  type6Form: any;
  type7aForm: any;
  type7bForm: any;
  type8Form: any;
  type9Form: any;
  type10Form: any;
  type11Form: any;
  type12Form: any;
  type13Form: any;
  type14Form: any;
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

export function autoFillPlannedActivityForm(ctx: AutoFillPlannedContext): {
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
  const testTitle = `[TEST-UI] แผนงานทดสอบ ${codeText} (${new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })})`;
  const testNotes = `หมายเหตุทดสอบระบบดึงข้อมูล UI (${codeText}) ครบทุกช่อง`;

  setTitle(testTitle);
  setStartDate(today);
  setEndDate(today);
  setNotes(testNotes);

  // Resolve real master data items
  const dealers = (masterData.customers || []).filter(
    (c) => !c.customerType || c.customerType === "DEALER",
  );
  const subdealers = (masterData.customers || []).filter(
    (c) =>
      c.customerType === "SUBDEALER" ||
      c.customerType === "Subdealer",
  );
  const firstDealer = dealers[0] || (masterData.customers || [])[0] || {
    id: "",
    name: "ร้านเกษตรเจริญรุ่งเรือง (ทดสอบ)",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
  };
  const firstSubdealer = subdealers[0] || firstDealer;
  const firstFarmer = (masterData.farmerCustomers || [])[0] || {
    id: "",
    name: "นายสมชาย ใจดี (เกษตรกรทดสอบ)",
    province: firstDealer.province || "เชียงใหม่",
    district: firstDealer.district || "เมืองเชียงใหม่",
  };
  const firstProduct = (masterData.products || [])[0] || {
    id: "",
    name: "ปืนใหญ่ โกลด์ 1000 ซีซี",
    unit: "ขวด",
    price: 450,
  };
  const secondProduct = (masterData.products || [])[1] || firstProduct;
  const firstDemoPlot = (masterData.demoPlots || [])[0] || null;
  const firstFollowUpPlan = (masterData.followUpPlans || [])[0] || null;
  const firstHattackPlan = (masterData.hattackFollowUpPlans || [])[0] || null;
  const firstHelper = (masterData.employees || [])[0] || null;

  const province = firstDealer.province || "เชียงใหม่";
  const district = firstDealer.district || "เมืองเชียงใหม่";

  // Location & Team
  if (locationTeamHook) {
    locationTeamHook.setProvince(province);
    setTimeout(() => {
      locationTeamHook.setDistrict(district);
    }, 30);
    locationTeamHook.setLocationText(
      `ห้องประชุมร้าน ${firstDealer.name} อ.${district} จ.${province}`,
    );
    if (firstHelper?.id) {
      locationTeamHook.setHelperEmployeeIds([firstHelper.id]);
    }
  }

  // Budget Section
  if (budgetHook) {
    budgetHook.setIsPromotionalMediaSelected(true);
    budgetHook.setMarketingProductItems([
      {
        id: "mkt-test-1",
        category: MARKETING_PRODUCT_CATEGORIES[0] || "Premium_item",
        productName: "เสื้อยืดแขนยาวตราปืนใหญ่ (ทดสอบ UI)",
        quantityCases: 10,
        unit: "ตัว",
        pricePerCase: 150,
      },
    ]);
    budgetHook.setIsSalesPromotionSelected(true);
    budgetHook.setSalesPromotionItems([
      {
        id: "sp-test-1",
        budgetType: "งบการตลาด",
        detail: "ค่าอาหารว่างและเครื่องดื่มสำหรับลูกค้า (ทดสอบ UI)",
        amount: 2500,
      },
    ]);
  }

  const snapshotFields: Record<
    string,
    { label: string; section: string; value: string }
  > = {
    title: { label: "ชื่อแผนงาน", section: "Header", value: testTitle },
    startDate: { label: "วันที่เริ่มต้น", section: "Header", value: today },
    endDate: { label: "วันที่สิ้นสุด", section: "Header", value: today },
    notes: { label: "หมายเหตุท้ายแผน", section: "Footer", value: testNotes },
  };

  // 1. TYPE_1 (useType1PlannedForm returns { items, setItems })
  if (codes.includes("TYPE_1") && ctx.type1Form?.setItems) {
    ctx.type1Form.setItems([
      {
        id: "t1-auto-1",
        visitPurpose: "STORE",
        province,
        isUnregisteredFarmer: false,
        storeId: firstDealer.id || "",
        customerName: firstDealer.name,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
        topic: "แจ้งข่าวสาร",
        notes: "หมายเหตุ TYPE_1: เข้าพบร้านค้าหลักตามแผนเพื่อแจ้งโปรโมชั่นใหม่",
      },
    ]);
    snapshotFields["t1.customerName"] = {
      label: "ชื่อร้านค้า/เกษตรกร",
      section: "TYPE_1",
      value: firstDealer.name,
    };
    snapshotFields["t1.topic"] = {
      label: "หัวข้อการเข้าพบ",
      section: "TYPE_1",
      value: "แจ้งข่าวสาร",
    };
  }

  // 2. TYPE_2 (useType2PlannedForm returns { type2Items, setType2Items })
  if (codes.includes("TYPE_2") && ctx.type2Form?.setType2Items) {
    ctx.type2Form.setType2Items([
      {
        id: "t2-auto-1",
        visitPurpose: "STORE",
        province,
        isUnregisteredFarmer: false,
        storeId: firstDealer.id || "",
        customerName: firstDealer.name,
        unregisteredFarmerName: "",
        unregisteredFarmerPhone: "",
        products: [
          {
            id: "t2-prod-1",
            productId: firstProduct.id || "",
            productName: firstProduct.name,
            notes: "ติดตามผลล็อตที่สั่งซื้อเดือนก่อน",
          },
        ],
        notes: "หมายเหตุ TYPE_2: ติดตามความพึงพอใจลูกค้า",
      },
    ]);
    snapshotFields["t2.customerName"] = {
      label: "ชื่อร้านค้า/เกษตรกร",
      section: "TYPE_2",
      value: firstDealer.name,
    };
    snapshotFields["t2.productName"] = {
      label: "สินค้าที่ติดตาม",
      section: "TYPE_2",
      value: firstProduct.name,
    };
  }

  // 3. TYPE_3 (useType3PlannedForm returns { type3Items, setType3Items })
  if (codes.includes("TYPE_3") && ctx.type3Form?.setType3Items) {
    ctx.type3Form.setType3Items([
      {
        id: "t3-auto-1",
        storeId: firstDealer.id || "",
        customerName: firstDealer.name,
        isSubDealer: false,
        isUnregisteredSubdealer: false,
        subdealerId: "",
        subdealerName: "",
        subDealerStore: "",
        products: [
          {
            id: "t3-prod-1",
            productId: firstProduct.id || "",
            productName: firstProduct.name,
            quantityCases: 10,
            pricePerCase: 2400,
          },
        ],
        notes: "หมายเหตุ TYPE_3: เปิดบิลโปรโมชั่นประจำเดือน",
      },
    ]);
    snapshotFields["t3.customerName"] = {
      label: "ร้านค้าเป้าหมาย",
      section: "TYPE_3",
      value: firstDealer.name,
    };
    snapshotFields["t3.productName"] = {
      label: "สินค้าเป้าหมาย",
      section: "TYPE_3",
      value: firstProduct.name,
    };
  }

  // 4. TYPE_4 (useType4PlannedForm returns { type4Items, setType4Items })
  if (codes.includes("TYPE_4") && ctx.type4Form?.setType4Items) {
    ctx.type4Form.setType4Items([
      {
        id: "t4-auto-1",
        storeId: firstDealer.id || "",
        customerName: firstDealer.name,
        collectType: "COLLECT",
        amount: 45000,
        billingDetail: "วางบิลและเก็บเช็คค่าสินค้า",
      },
    ]);
    snapshotFields["t4.customerName"] = {
      label: "ชื่อร้านค้า",
      section: "TYPE_4",
      value: firstDealer.name,
    };
    snapshotFields["t4.amountOrDetail"] = {
      label: "ยอดเงินตามแผน",
      section: "TYPE_4",
      value: "45000",
    };
  }

  // 5. TYPE_5 (useType5PlannedForm returns { type5Items, setType5Items })
  if (codes.includes("TYPE_5") && ctx.type5Form?.setType5Items) {
    ctx.type5Form.setType5Items([
      {
        id: "t5-auto-1",
        storeId: firstDealer.id || "",
        storeName: firstDealer.name,
        productId: firstProduct.id || "",
        comparedProduct: firstProduct.name,
        detail: "สำรวจราคาสารกำจัดวัชพืชคู่แข่งในพื้นที่",
      },
    ]);
    snapshotFields["t5.storeName"] = {
      label: "ร้านค้าที่สำรวจ",
      section: "TYPE_5",
      value: firstDealer.name,
    };
    snapshotFields["t5.comparedProduct"] = {
      label: "สินค้าเปรียบเทียบ",
      section: "TYPE_5",
      value: firstProduct.name,
    };
  }

  // 6. TYPE_6 (useType6PlannedForm returns { type6Items, setType6Items })
  if (codes.includes("TYPE_6") && ctx.type6Form?.setType6Items) {
    ctx.type6Form.setType6Items([
      {
        id: "t6-auto-1",
        isManualCustomer: false,
        storeId: firstDealer.id || null,
        customerName: firstDealer.name,
        manualCustomerName: "",
        manualCustomerAddress: "",
        manualCustomerPhone: "",
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "ตรวจสอบฝาขวดซึมจากการขนส่งจำนวน 2 ขวด",
        purchaseChannel: "ร้านค้าตัวแทนจำหน่าย",
        productId: firstProduct.id || null,
        productName: firstProduct.name,
        lotNumber: "LOT-2026-10A",
      },
    ]);
    snapshotFields["t6.customerName"] = {
      label: "ชื่อลูกค้า/ร้านค้า",
      section: "TYPE_6",
      value: firstDealer.name,
    };
    snapshotFields["t6.lotNumber"] = {
      label: "เลขล็อตสินค้า",
      section: "TYPE_6",
      value: "LOT-2026-10A",
    };
  }

  // 7. TYPE_7A (useType7aPlannedForm returns { type7aPlots, setType7aPlots })
  if (codes.includes("TYPE_7A") && ctx.type7aForm?.setType7aPlots) {
    const plotName = `แปลงสาธิตข้าวหอมมะลิ - ${firstFarmer.name}`;
    const prods = [
      {
        id: "t7a-prod-1",
        productId: firstProduct.id || "",
        productName: firstProduct.name,
        quantity: 4,
        targetQuantity: 4,
        unit: firstProduct.unit || "ขวด",
      },
    ];
    ctx.type7aForm.setType7aPlots([
      {
        id: "t7a-auto-1",
        plotName,
        farmerName: firstFarmer.name,
        ownerName: firstFarmer.name,
        storeId: firstDealer.id || null,
        province,
        district,
        cropCategory: "นาข้าว",
        cropName: "ข้าวหอมมะลิ 105",
        customCropName: "",
        areaRai: 15,
        treeCount: null,
        objective: "สาธิตประสิทธิภาพการคุมวัชพืชในนาข้าว",
        notes: "หมายเหตุ TYPE_7A: แปลงสาธิตริมถนนหลัก",
        hasProducts: true,
        demoProducts: prods,
        products: prods,
      },
    ]);
    snapshotFields["t7a.plotName"] = {
      label: "ชื่อแปลงสาธิต",
      section: "TYPE_7A",
      value: plotName,
    };
  }

  // 8. TYPE_7B (useType7bPlannedForm returns { type7bItems, setType7bItems })
  if (codes.includes("TYPE_7B") && ctx.type7bForm?.setType7bItems) {
    const plotId =
      firstFollowUpPlan?.demoPlotId ||
      firstFollowUpPlan?.plots?.[0]?.id ||
      firstDemoPlot?.id ||
      "demo-plot-auto-1";
    const plotName =
      firstFollowUpPlan?.plotName ||
      firstFollowUpPlan?.plots?.[0]?.name ||
      firstDemoPlot?.name ||
      `แปลงสาธิตติดตามผล - ${firstFarmer.name}`;
    ctx.type7bForm.setType7bItems([
      {
        id: "t7b-auto-1",
        plotActivityType: "FOLLOW_UP",
        selectedPlanId:
          firstFollowUpPlan?.activityPlanId || firstFollowUpPlan?.id || "",
        selectedPlotIds: [plotId],
        demoPlotId: plotId,
        existingPlotId: plotId,
        existingPlotName: plotName,
        plotName,
        farmerName:
          firstFollowUpPlan?.farmerName ||
          firstDemoPlot?.ownerName ||
          firstFarmer.name,
        ownerName:
          firstFollowUpPlan?.farmerName ||
          firstDemoPlot?.ownerName ||
          firstFarmer.name,
        storeId: firstDealer.id || "",
        province: firstFollowUpPlan?.province || province,
        district: firstFollowUpPlan?.district || district,
        cropCategory: firstFollowUpPlan?.cropCategory || "นาข้าว",
        cropName: firstFollowUpPlan?.cropName || "ข้าวหอมมะลิ 105",
        customCropName: "",
        areaRai: firstFollowUpPlan?.areaRai || 15,
        treeCount: null,
        objective: "ติดตามผลหลังพ่นยาครบ 7 วัน",
        detail: "ติดตามผลหลังพ่นยาครบ 7 วัน เช็คการยุบตัวของวัชพืช",
        productId: firstProduct.id || "",
        productName: firstProduct.name,
        hasProductWithdrawal: false,
        withdrawnProducts: [],
        demoProducts: [],
      },
    ]);
    snapshotFields["t7b.plotName"] = {
      label: "แปลงสาธิตที่ติดตาม",
      section: "TYPE_7B",
      value: plotName,
    };
  }

  // 9. TYPE_8 (useType8PlannedForm returns { type8Items, setType8Items })
  if (codes.includes("TYPE_8") && ctx.type8Form?.setType8Items) {
    ctx.type8Form.setType8Items([
      {
        id: "t8-auto-1",
        meetingTarget: "FARMER",
        farmerChannel: "DEALER",
        dealerId: firstDealer.id || "",
        dealerName: firstDealer.name,
        subdealerId: "",
        subDealerStore: "",
        isUnregisteredSubdealer: false,
        topic: "เทคนิคการเพิ่มผลผลิตข้าวและป้องกันโรคแมลง",
        targetProducts: [firstProduct.name],
        targetProductIds: firstProduct.id ? [firstProduct.id] : [],
        attendeesCount: 40,
        detail: "จัดประชุมเกษตรกรร่วมกับร้านค้าตัวแทนจำหน่าย",
        venueType: "STORE",
        promotionProducts: [
          {
            id: "t8-promo-1",
            productId: firstProduct.id || "",
            productName: firstProduct.name,
            quantityCases: 5,
            pricePerCase: 2400,
            notes: "ซื้อครบ 1 ลัง แถมเสื้อยืด 2 ตัว",
          },
        ],
      },
    ]);
    snapshotFields["t8.topic"] = {
      label: "หัวข้อการจัดประชุม",
      section: "TYPE_8",
      value: "เทคนิคการเพิ่มผลผลิตข้าวและป้องกันโรคแมลง",
    };
  }

  // 10. TYPE_9 (useType9PlannedForm returns individual setters)
  if (codes.includes("TYPE_9") && ctx.type9Form) {
    const isUnreg = !subdealers[0]?.id;
    ctx.type9Form.setIsUnregisteredSubdealer(isUnreg);
    if (!isUnreg) {
      ctx.type9Form.setSubdealerId(firstSubdealer.id);
      ctx.type9Form.setSubdealerName(firstSubdealer.name);
      ctx.type9Form.setSubDealerStore("");
    } else {
      ctx.type9Form.setSubdealerId("");
      ctx.type9Form.setSubdealerName("");
      ctx.type9Form.setSubDealerStore("ร้านเกษตรเจริญทรัพย์ (ซับดีลเลอร์ทดสอบ)");
    }
    ctx.type9Form.setSubDealerProvince(firstSubdealer.province || province);
    setTimeout(() => {
      ctx.type9Form.setSubDealerDistrict(firstSubdealer.district || district);
    }, 30);
    ctx.type9Form.setParentDealerId(firstDealer.id || "");
    ctx.type9Form.setParentDealerName(firstDealer.name);
    ctx.type9Form.setType9Store(
      !isUnreg
        ? firstSubdealer.name
        : "ร้านเกษตรเจริญทรัพย์ (ซับดีลเลอร์ทดสอบ)",
    );
    ctx.type9Form.setType9Sales(35000);
    ctx.type9Form.setType9ProductItems([
      {
        id: "t9-prod-1",
        productId: firstProduct.id || "",
        productName: firstProduct.name,
        quantityCases: 10,
        pricePerCase: 3500,
      },
    ]);
    snapshotFields["t9.subDealerStore"] = {
      label: "ร้านค้าซับดีลเลอร์",
      section: "TYPE_9",
      value: !isUnreg
        ? firstSubdealer.name
        : "ร้านเกษตรเจริญทรัพย์ (ซับดีลเลอร์ทดสอบ)",
    };
  }

  // 11. TYPE_10 (useType10PlannedForm returns individual setters)
  if (codes.includes("TYPE_10") && ctx.type10Form) {
    const plotVal =
      firstDemoPlot?.id ||
      firstDemoPlot?.name ||
      `แปลงสาธิต Field Day - ${firstFarmer.name}`;
    ctx.type10Form.setType10DemoPlot(plotVal);
    ctx.type10Form.setType10Location(`ต.ในเมือง อ.${district} จ.${province}`);
    ctx.type10Form.setType10TargetCrop(
      firstDemoPlot?.cropName || "ข้าวหอมมะลิ 105",
    );
    ctx.type10Form.setType10Showcase(firstProduct.name);
    ctx.type10Form.setType10Attendees(80);
    ctx.type10Form.setType10BookingSales(120000);
    snapshotFields["t10.plotName"] = {
      label: "ชื่อแปลงสาธิต Field Day",
      section: "TYPE_10",
      value: plotVal,
    };
  }

  // 12. TYPE_11 (useType11PlannedForm returns { type11Stores, setType11Stores })
  if (codes.includes("TYPE_11") && ctx.type11Form?.setType11Stores) {
    ctx.type11Form.setType11Stores([
      {
        storeId: firstDealer.id || "",
        storeName: firstDealer.name,
        notes: "หมายเหตุ TYPE_11: ตรวจเช็คสต๊อกสินค้าหลักและวันหมดอายุ",
      },
    ]);
    snapshotFields["t11.storeName"] = {
      label: "ร้านค้าเป้าหมายเช็คสต๊อก",
      section: "TYPE_11",
      value: firstDealer.name,
    };
  }

  // 13. TYPE_12 (useType12PlannedForm returns individual setters)
  if (codes.includes("TYPE_12") && ctx.type12Form) {
    ctx.type12Form.setType12TourType("STORE");
    ctx.type12Form.setType12TourSize("LARGE");
    ctx.type12Form.setType12StoreId(firstDealer.id || "");
    ctx.type12Form.setType12Store(firstDealer.name);
    ctx.type12Form.setType12Destination("จังหวัดเชียงราย - ภูชี้ฟ้า");
    ctx.type12Form.setType12Country("ประเทศไทย");
    snapshotFields["t12.tourDestination"] = {
      label: "สถานที่ปลายทาง",
      section: "TYPE_12",
      value: "จังหวัดเชียงราย - ภูชี้ฟ้า",
    };
  }

  // 14. TYPE_13 (useType13PlannedForm returns { type13Plots, setType13Plots, setHasProductWithdrawal, setWithdrawnProducts })
  if (codes.includes("TYPE_13") && ctx.type13Form?.setType13Plots) {
    const withdrawnList = [
      {
        id: "t13-prod-1",
        productId: firstProduct.id || "",
        productName: firstProduct.name,
        quantity: 5,
        unit: firstProduct.unit || "ขวด",
      },
    ];
    ctx.type13Form.setHasProductWithdrawal(true);
    ctx.type13Form.setWithdrawnProducts(withdrawnList);
    ctx.type13Form.setType13Plots([
      {
        id: "t13-plot-1",
        demoPlotId: null,
        name: "บ้านทุ่งเจริญ หมู่ 4",
        plotName: "บ้านทุ่งเจริญ หมู่ 4",
        storeId: firstDealer.id || "",
        dealerName: firstDealer.name,
        ownerName: firstFarmer.name,
        province,
        district,
        subdistrict: "ตำบลแม่ยาว",
        village: "บ้านทุ่งเจริญ หมู่ 4",
        objective: "ปูพรมฉีดพ่นแปลงแฮตแทคจุดยุทธศาสตร์",
        plannedPlotsCount: 5,
        latitude: "18.8012",
        longitude: "98.9815",
        hasProductWithdrawal: true,
        withdrawnProducts: withdrawnList,
        products: withdrawnList,
      },
    ]);
    snapshotFields["t13.dealerName"] = {
      label: "ร้านค้าดีลเลอร์",
      section: "TYPE_13",
      value: firstDealer.name,
    };
    snapshotFields["t13.village"] = {
      label: "หมู่บ้านที่ทำแปลง",
      section: "TYPE_13",
      value: "บ้านทุ่งเจริญ หมู่ 4",
    };
  }

  // 15. TYPE_14 (useType14PlannedForm returns { data, setData })
  if (codes.includes("TYPE_14") && ctx.type14Form?.setData) {
    const hPlan = firstHattackPlan;
    const hPlot = hPlan?.plots?.[0] || hPlan?.targets?.[0];
    const plotId = hPlot?.id || "t14-plot-auto-1";
    const plotName =
      hPlot?.plotName || hPlot?.name || "บ้านทุ่งเจริญ หมู่ 4 (แปลงแฮตแทค)";
    ctx.type14Form.setData({
      mode: "EXISTING_PLOT",
      selectedPlanId: hPlan?.id || hPlan?.activityPlanId || "hattack-plan-auto-1",
      selectedPlotIds: [plotId],
      type13TargetIds: [plotId],
      demoPlotId: plotId,
      name: plotName,
      storeId: hPlot?.storeId || firstDealer.id || "",
      dealerName: hPlot?.dealerName || firstDealer.name,
      ownerName: firstFarmer.name,
      cropCategory: "นาข้าว",
      cropName: "ข้าวหอมมะลิ 105",
      areaRai: 10,
      treeCount: null,
      province: hPlot?.province || province,
      district: hPlot?.district || district,
      latitude: "18.8012",
      longitude: "98.9815",
      hasProductWithdrawal: true,
      withdrawnProducts: [
        {
          id: "t14-prod-1",
          productId: secondProduct.id || firstProduct.id || "",
          productName: secondProduct.name || firstProduct.name,
          quantity: 2,
          unit: firstProduct.unit || "ขวด",
        },
      ],
      notes: "หมายเหตุ TYPE_14: ติดตามผลแปลงแฮตแทคหลังพ่นยา",
      plots: [
        {
          id: plotId,
          demoPlotId: plotId,
          type13TargetId: plotId,
          name: plotName,
          plotName,
          storeId: hPlot?.storeId || firstDealer.id || "",
          dealerName: hPlot?.dealerName || firstDealer.name,
          ownerName: firstFarmer.name,
          province: hPlot?.province || province,
          district: hPlot?.district || district,
          subdistrict: hPlot?.subdistrict || "ตำบลแม่ยาว",
          village: hPlot?.village || "บ้านทุ่งเจริญ หมู่ 4",
          plannedPlotsCount: 5,
        },
      ],
    });
    snapshotFields["t14.plotName"] = {
      label: "แปลงแฮตแทคที่เลือกติดตาม",
      section: "TYPE_14",
      value: plotName,
    };
  }

  saveTestSnapshot({
    mode: "PLANNED",
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
