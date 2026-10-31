"use client";

import { createMockImageFile } from "./mock-image-helper";
import { saveTestSnapshot } from "./snapshot-storage";

/**
 * ฟังก์ชันกรอกข้อมูลทดสอบอัตโนมัติ (1-Click Auto-Fill)
 * สำหรับหน้า 2. บันทึกผลการปฏิบัติงาน (Trip Plan Actual)
 * รองรับครบทั้ง TYPE_1 - TYPE_14 ตามประเภทงานที่อยู่ในแผนงานนั้นๆ
 * พร้อมสร้างไฟล์รูปภาพจำลอง (Real PNG File) เพื่อทดสอบการอัปโหลดและดึงรูปกลับมาแสดงในช่อง UI
 */
export interface AutoFillActualContext {
  plan: any;
  activeWorkTypeCodes: string[];
  products: any[];
  customers: any[];
  targets?: {
    t1?: any[];
    t2?: any[];
    t3?: any[];
    t4?: any[];
    t5?: any[];
    t6?: any[];
    t7a?: any[];
    t7b?: any[];
    t8?: any[];
    t9?: any[];
    t10?: any[];
    t11?: any[];
    t12?: any[];
    t13?: any[];
    t14?: any[];
  };
  actualHooks: {
    setStatus: (val: any) => void;
    type1: any;
    type2: any;
    type3: any;
    type4: any;
    type5: any;
    type6: any;
    type7a: any;
    type7b: any;
    type8: any;
    type9: any;
    type10: any;
    type11: any;
    type12: any;
    type13: any;
    type14: any;
  };
}

export function autoFillActualActivityForm(params: AutoFillActualContext) {
  const { plan, activeWorkTypeCodes, products, customers, targets, actualHooks } = params;
  const tag = new Date().toTimeString().slice(0, 5).replace(":", "");
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const firstProd = products?.[0] || {
    id: "",
    name: "ไซเพอร์เมทริน 35",
    category: "ยาฆ่าแมลง",
    price: 2400,
    dealerPrice: 2400,
  };
  const firstStore =
    customers?.find((c: any) => c.type !== "FARMER" && c.customerType !== "FARMER") ||
    customers?.[0] || {
      id: "",
      name: "ร้านเกษตรเจริญทรัพย์",
    };

  actualHooks.setStatus("COMPLETED");

  const snapFields: Record<string, { label: string; section: string; value: string }> = {
    status: {
      label: "สถานะแผนงาน (Status)",
      section: "สถานะการบันทึกผล",
      value: "COMPLETED",
    },
  };

  // TYPE_1
  if (activeWorkTypeCodes.includes("TYPE_1")) {
    const t1 = actualHooks.type1;
    const mockImg = createMockImageFile(`T1-Visit-${tag}`, 1);
    const discText = `[TEST-${tag}] สรุปผลการเข้าพบลูกค้า: ลูกค้าพึงพอใจคุณภาพสินค้าและสนใจสั่งซื้อเพิ่ม`;
    const oppText = `[TEST-${tag}] มีโอกาสปิดการขายล็อตใหม่ 25 ลัง ภายในสัปดาห์หน้า`;
    const nextActText = `[TEST-${tag}] นัดส่งใบเสนอราคาและติดตามออเดอร์`;
    const prodAdvText = `[TEST-${tag}] แนะนำ ${firstProd.name} อัตรา 30 ซีซี/น้ำ 20 ลิตร`;

    t1.setT1DiscussionResult?.(discText);
    t1.setT1Detail?.(discText);
    t1.setT1SalesOpportunity?.(oppText);
    t1.setT1NextAction?.(nextActText);
    t1.setT1NextMeetingDate?.(nextWeek);
    t1.setT1ProductAdvice?.(prodAdvText);
    t1.setT1FarmerHomeAddress?.(`99/1 หมู่ 4 ต.ในเมือง [TEST-${tag}]`);
    t1.setT1PlotLatitude?.("14.979900");
    t1.setT1PlotLongitude?.("102.097700");
    t1.setT1PlotImages?.([mockImg]);
    t1.setT1AdvisedProducts?.([
      {
        id: `t1-adv-${Date.now()}`,
        productId: firstProd.id || "",
        productName: firstProd.name || "สินค้าทดสอบ",
        category: firstProd.category || "ยาฆ่าแมลง",
      },
    ]);

    const baseTargets =
      t1.t1TargetItems?.length > 0
        ? t1.t1TargetItems
        : targets?.t1?.length
          ? targets.t1
          : [{ id: "target-0", storeName: firstStore.name }];

    const updatedItems = baseTargets.map((item: any, idx: number) => ({
      ...item,
      discussionResult: discText,
      detail: discText,
      salesOpportunity: oppText,
      nextAction: nextActText,
      nextMeetingDate: nextWeek,
      productAdvice: prodAdvText,
      farmerHomeAddress: `99/1 หมู่ 4 ต.ในเมือง [TEST-${tag}]`,
      plotLatitude: "14.979900",
      plotLongitude: "102.097700",
      plotImages: [createMockImageFile(`T1-Visit-${idx + 1}`, idx + 1)],
      advisedProducts: [
        {
          id: `t1-adv-${idx}-${Date.now()}`,
          productId: firstProd.id || "",
          productName: firstProd.name || "สินค้าทดสอบ",
          category: firstProd.category || "ยาฆ่าแมลง",
        },
      ],
    }));
    t1.syncFromTargetItems?.(updatedItems);

    snapFields["act.t1.discussionResult"] = {
      label: "สรุปผลการพูดคุย (Discussion Result)",
      section: "TYPE_1: บันทึกผลเยี่ยมลูกค้า",
      value: discText,
    };
    snapFields["act.t1.salesOpportunity"] = {
      label: "โอกาสการขาย (Sales Opportunity)",
      section: "TYPE_1: บันทึกผลเยี่ยมลูกค้า",
      value: oppText,
    };
    snapFields["act.t1.images"] = {
      label: "รูปถ่ายการเข้าเยี่ยม (Images)",
      section: "TYPE_1: บันทึกผลเยี่ยมลูกค้า",
      value: `${updatedItems.length} รูป`,
    };
  }

  // TYPE_2
  if (activeWorkTypeCodes.includes("TYPE_2")) {
    const t2 = actualHooks.type2;
    const mockImg = createMockImageFile(`T2-Followup-${tag}`, 2);
    const followupText = `[TEST-${tag}] ผลการใช้สินค้าดีมาก ใบเขียวสมบูรณ์ ไม่พบแมลงรบกวนซ้ำ`;

    t2.setT2UsageResult?.("GOOD");
    t2.setT2FollowupDetail?.(followupText);
    t2.setT2Detail?.(followupText);
    t2.setT2ProblemDetail?.("");
    t2.setT2Images?.([mockImg]);

    const currentResults =
      t2.t2FollowupResults?.length > 0
        ? t2.t2FollowupResults
        : [
            {
              id: `t2-res-${Date.now()}`,
              productId: firstProd.id || "",
              productName: firstProd.name || "สินค้าทดสอบ",
              category: firstProd.category || "ยาฆ่าแมลง",
            },
          ];

    const updatedFollowups = currentResults.map((p: any, idx: number) => ({
      ...p,
      usageResult: "GOOD",
      followupDetail: followupText,
      problemDetail: "",
      images: [createMockImageFile(`T2-Followup-${idx + 1}`, idx + 1)],
    }));
    t2.setT2FollowupResults?.(updatedFollowups);

    snapFields["act.t2.usageResult"] = {
      label: "ผลการใช้สินค้า (Usage Result)",
      section: "TYPE_2: บันทึกผลติดตามสินค้า",
      value: "GOOD",
    };
    snapFields["act.t2.followupDetail"] = {
      label: "รายละเอียดผลการติดตาม",
      section: "TYPE_2: บันทึกผลติดตามสินค้า",
      value: followupText,
    };
    snapFields["act.t2.images"] = {
      label: "รูปถ่ายติดตามผล (Images)",
      section: "TYPE_2: บันทึกผลติดตามสินค้า",
      value: "1 รูป",
    };
  }

  // TYPE_3
  if (activeWorkTypeCodes.includes("TYPE_3")) {
    const t3 = actualHooks.type3;
    const unitPrice = Number(firstProd.dealerPrice || firstProd.price || 2400);
    const qty = 10;
    const total = unitPrice * qty;

    t3.setSoldProducts?.(firstProd.name || "ไซเพอร์เมทริน 35");
    t3.setActualQuantity?.(String(qty));
    t3.setActualSales?.(String(total));
    t3.setUnclosedReason?.("");

    const baseDetails =
      t3.productSalesDetails?.length > 0
        ? t3.productSalesDetails
        : [
            {
              id: `t3-prod-${Date.now()}`,
              productId: firstProd.id || "",
              productName: firstProd.name || "ไซเพอร์เมทริน 35",
              unitPrice: String(unitPrice),
            },
          ];

    const updatedDetails = baseDetails.map((p: any) => {
      const up = Number(p.unitPrice || unitPrice);
      return {
        ...p,
        actualQuantity: String(qty),
        actualSales: String(up * qty),
        actualTotal: String(up * qty),
        unclosedReason: "",
      };
    });
    t3.setProductSalesDetails?.(updatedDetails);

    snapFields["act.t3.actualQuantity"] = {
      label: "จำนวนที่ขายได้จริง (ลัง)",
      section: "TYPE_3: บันทึกผลเปิดการขาย",
      value: String(qty),
    };
    snapFields["act.t3.actualTotal"] = {
      label: "ยอดขายรวมจริง (บาท)",
      section: "TYPE_3: บันทึกผลเปิดการขาย",
      value: String(updatedDetails[0]?.actualSales || total),
    };
  }

  // TYPE_4
  if (activeWorkTypeCodes.includes("TYPE_4")) {
    const t4 = actualHooks.type4;
    const mockImg = createMockImageFile(`T4-Slip-${tag}`, 4);
    const orderNo = `INV-${tag}`;
    const amount = "45000";
    const collectText = `[TEST-${tag}] รับชำระเงินโอนครบตามใบวางบิลเรียบร้อย`;

    t4.setT4OrderNo?.(orderNo);
    t4.setT4ReceivedAmount?.(amount);
    t4.setT4BillingStatus?.("BILLED");
    t4.setT4BillingDetail?.(`[TEST-${tag}] วางบิลเรียบร้อย นัดรับเช็คสัปดาห์หน้า`);
    t4.setT4CollectDetail?.(collectText);
    if (t4.setT4PaymentImages) {
      t4.setT4PaymentImages([mockImg]);
    } else if (t4.handleUploadImages && mockImg.rawFile) {
      t4.handleUploadImages([mockImg.rawFile]);
    }

    if (t4.t4Items?.length > 0) {
      const updatedItems = t4.t4Items.map((it: any) => ({
        ...it,
        orderNo: it.orderNo || orderNo,
        receivedAmount: it.expectedAmount || amount,
        billingStatus: "BILLED",
        billingDetail: `[TEST-${tag}] วางบิลเรียบร้อย`,
        collectDetail: collectText,
        paymentImages: [mockImg],
      }));
      t4.setT4Items?.(updatedItems);
    }

    snapFields["act.t4.receivedAmount"] = {
      label: "ยอดเงินที่รับจริง / สถานะวางบิล",
      section: "TYPE_4: บันทึกผลวางบิล/เก็บเงิน",
      value: amount,
    };
    snapFields["act.t4.collectDetail"] = {
      label: "รายละเอียดการรับชำระ/วางบิล",
      section: "TYPE_4: บันทึกผลวางบิล/เก็บเงิน",
      value: collectText,
    };
  }

  // TYPE_5
  if (activeWorkTypeCodes.includes("TYPE_5")) {
    const t5 = actualHooks.type5;
    const brandName = `บริษัท คู่แข่งเกษตรเคมี จำกัด (${tag})`;
    const prodName = `อามีทราซ-เอ็กซ์ตร้า (${tag})`;
    const mockBottle = createMockImageFile(`T5-Bottle-${tag}`, 5);
    const mockPromo = createMockImageFile(`T5-Promo-${tag}`, 6);

    t5.setT5CompetitorBrand?.(brandName);
    t5.setT5CompetitorProduct?.(prodName);

    const baseSurveys =
      t5.t5SurveyDetails?.length > 0
        ? t5.t5SurveyDetails
        : [
            {
              id: `t5-surv-${Date.now()}`,
              storeId: firstStore.id || "",
              storeName: firstStore.name || "ร้านค้าทดสอบ",
              productId: firstProd.id || "",
              productName: firstProd.name || "สินค้าบริษัท",
            },
          ];

    baseSurveys.forEach((item: any, idx: number) => {
      const targetId = item.id || String(idx);
      if (t5.handleUpdateT5SurveyItem) {
        t5.handleUpdateT5SurveyItem(targetId, "competitorBrand", brandName);
        t5.handleUpdateT5SurveyItem(targetId, "competitorProduct", prodName);
        t5.handleUpdateT5SurveyItem(targetId, "commonName", "อะมีทราซ 20% EC");
        t5.handleUpdateT5SurveyItem(targetId, "packageSize", "1 ลิตร x 12 ขวด");
        t5.handleUpdateT5SurveyItem(targetId, "dealerPrice", "1950");
        t5.handleUpdateT5SurveyItem(targetId, "subdealerPrice", "2150");
        t5.handleUpdateT5SurveyItem(targetId, "farmerPrice", "2400");
        t5.handleUpdateT5SurveyItem(
          targetId,
          "promotionDetail",
          `[TEST-${tag}] ซื้อ 10 ลัง แถม 1 ลัง`,
        );
        t5.handleUpdateT5SurveyItem(
          targetId,
          "remark",
          `[TEST-${tag}] สินค้าคู่แข่งวางโชว์หน้าร้าน`,
        );
        t5.handleUpdateT5SurveyItem(targetId, "bottleImages", [mockBottle]);
        t5.handleUpdateT5SurveyItem(targetId, "promotionalImages", [mockPromo]);
      }
    });

    if (t5.setT5SurveyDetails) {
      t5.setT5SurveyDetails(
        baseSurveys.map((item: any) => ({
          ...item,
          competitorBrand: brandName,
          competitorProduct: prodName,
          commonName: "อะมีทราซ 20% EC",
          packageSize: "1 ลิตร x 12 ขวด",
          dealerPrice: "1950",
          subdealerPrice: "2150",
          farmerPrice: "2400",
          promotionDetail: `[TEST-${tag}] ซื้อ 10 ลัง แถม 1 ลัง`,
          remark: `[TEST-${tag}] สินค้าคู่แข่งวางโชว์หน้าร้าน`,
          bottleImages: [mockBottle],
          promotionalImages: [mockPromo],
        })),
      );
    }

    snapFields["act.t5.competitorBrand"] = {
      label: "บริษัท/แบรนด์คู่แข่ง",
      section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
      value: brandName,
    };
    snapFields["act.t5.competitorProduct"] = {
      label: "ชื่อการค้าสินค้าคู่แข่ง",
      section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
      value: prodName,
    };
    snapFields["act.t5.dealerPrice"] = {
      label: "ราคาดีลเลอร์ (บาท)",
      section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
      value: "1950",
    };
    snapFields["act.t5.bottleImages"] = {
      label: "รูปถ่ายขวดสินค้าคู่แข่ง",
      section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
      value: "1 รูป",
    };
  }

  // TYPE_6
  if (activeWorkTypeCodes.includes("TYPE_6")) {
    const t6 = actualHooks.type6;
    const detailText = `[TEST-${tag}] ตรวจสอบล็อตสินค้าและเปลี่ยนขวดใหม่ให้ลูกค้าเรียบร้อย`;
    const lotNo = `LOT-2026-${tag}`;
    const mockImg = createMockImageFile(`T6-Issue-${tag}`, 6);

    t6.setT6ProductId?.(firstProd.id || "");
    t6.setT6ProductName?.(firstProd.name || "สินค้าทดสอบ");
    t6.setT6LotNumber?.(lotNo);
    t6.setT6PurchaseChannel?.("DEALER");
    t6.setT6StoreId?.(firstStore.id || "");
    t6.setT6StoreName?.(firstStore.name || "ร้านค้าทดสอบ");
    t6.setT6IssueType?.("ปัญหาบรรจุภัณฑ์ / ซีลฝาซึม");
    t6.setT6Detail?.(detailText);
    t6.setT6Status?.("RESOLVED");
    t6.setT6Images?.([mockImg]);

    if (t6.t6IssueDetails?.length > 0 && t6.handleUpdateT6IssueItem) {
      t6.t6IssueDetails.forEach((it: any, idx: number) => {
        const itemId = it.id || String(idx);
        t6.handleUpdateT6IssueItem(itemId, "productId", firstProd.id || "");
        t6.handleUpdateT6IssueItem(itemId, "productName", firstProd.name || "สินค้าทดสอบ");
        t6.handleUpdateT6IssueItem(itemId, "lotNumber", lotNo);
        t6.handleUpdateT6IssueItem(itemId, "purchaseChannel", "DEALER");
        t6.handleUpdateT6IssueItem(itemId, "storeId", firstStore.id || "");
        t6.handleUpdateT6IssueItem(itemId, "storeName", firstStore.name || "ร้านค้าทดสอบ");
        t6.handleUpdateT6IssueItem(itemId, "issueType", "ปัญหาบรรจุภัณฑ์ / ซีลฝาซึม");
        t6.handleUpdateT6IssueItem(itemId, "detail", detailText);
        t6.handleUpdateT6IssueItem(itemId, "status", "RESOLVED");
        t6.handleUpdateT6IssueItem(itemId, "images", [mockImg]);
      });
    }

    snapFields["act.t6.detail"] = {
      label: "สาเหตุและแนวทางแก้ไขปัญหา",
      section: "TYPE_6: บันทึกผลแก้ไขปัญหาสินค้า",
      value: detailText,
    };
    snapFields["act.t6.status"] = {
      label: "สถานะการแก้ไขปัญหา",
      section: "TYPE_6: บันทึกผลแก้ไขปัญหาสินค้า",
      value: "RESOLVED",
    };
    snapFields["act.t6.images"] = {
      label: "รูปถ่ายหลักฐานการแก้ไขปัญหา",
      section: "TYPE_6: บันทึกผลแก้ไขปัญหาสินค้า",
      value: "1 รูป",
    };
  }

  // TYPE_7A
  if (activeWorkTypeCodes.includes("TYPE_7A")) {
    const t7a = actualHooks.type7a;
    const mockImg = createMockImageFile(`T7A-DemoPlot-${tag}`, 7);
    const updateField = t7a.handleUpdateField;

    if (updateField) {
      updateField("t7PlotName", t7a.t7PlotName || `แปลงสาธิตทดสอบ ${tag}`);
      updateField("t7FarmerName", t7a.t7FarmerName || "นายสมหมาย สายเกษตร");
      updateField("t7FarmerPhone", "0812345678");
      updateField("t7CropCategory", t7a.t7CropCategory || "นาข้าว");
      updateField("t7CropName", t7a.t7CropName || "ข้าวหอมมะลิ 105");
      updateField("t7CropAge", "45 วัน");
      updateField("t7AreaRai", t7a.t7AreaRai || "10");
      updateField("t7Latitude", "14.979900");
      updateField("t7Longitude", "102.097700");
      updateField(
        "t7PlotObjective",
        t7a.t7PlotObjective || `[TEST-${tag}] สาธิตการป้องกันเพลี้ยกระโดดสีน้ำตาล`,
      );
      updateField("t7ProblemFound", `[TEST-${tag}] พบเพลี้ยกระโดดระยะตัวอ่อน 3-5 ตัว/กอ`);
      updateField("t7WaterVolumeLiters", "200");
      updateField("t7SprayedAreaRai", "5");
      updateField("t7SprayMethod", "โดรนพ่นยา");
      updateField("t7InitialPhotos", [mockImg]);
    }

    snapFields["act.t7a.coords"] = {
      label: "พิกัดแปลงสาธิต (Latitude / Longitude)",
      section: "TYPE_7A: บันทึกผลทำแปลงสาธิตใหม่",
      value: "14.979900, 102.097700",
    };
    snapFields["act.t7a.beforeImages"] = {
      label: "รูปถ่ายแปลงสาธิต (Initial Photos)",
      section: "TYPE_7A: บันทึกผลทำแปลงสาธิตใหม่",
      value: "1 รูป",
    };
  }

  // TYPE_7B
  if (activeWorkTypeCodes.includes("TYPE_7B")) {
    const t7b = actualHooks.type7b;
    const mockCropImg = createMockImageFile(`T7B-Crop-${tag}`, 8);
    const mockPlotImg = createMockImageFile(`T7B-Plot-${tag}`, 9);
    const mockRoundImg = createMockImageFile(`T7B-Round1-${tag}`, 10);
    const respText = `[TEST-${tag}] ใบข้าวเขียวตั้งตรง เพลี้ยตาย 95% เกษตรกรพึงพอใจมาก`;

    if (t7b.handleUpdateField) {
      t7b.handleUpdateField("t7DaysAfterSpray", "7");
      t7b.handleUpdateField("t7CropCondition", "ดีมาก (สมบูรณ์)");
      t7b.handleUpdateField("t7ProductResponse", respText);
      t7b.handleUpdateField("t7EffectivenessScore", "5");
      t7b.handleUpdateField("t7SatisfactionScore", "5");
      t7b.handleUpdateField(
        "t7FarmerFeedback",
        `[TEST-${tag}] เกษตรกรประทับใจผลลัพธ์ เตรียมแนะนำเพื่อนบ้าน`,
      );
      t7b.handleUpdateField("t7CropImages", [mockCropImg]);
      t7b.handleUpdateField("t7PlotImages", [mockPlotImg]);
    }

    const rounds = t7b.actualState?.t7SprayingRounds || [];
    if (rounds.length > 0 && t7b.updateSprayingRoundField) {
      const rId = rounds[0].id;
      t7b.updateSprayingRoundField(rId, "daysAfterSpray", "7");
      t7b.updateSprayingRoundField(rId, "cropCondition", "ดีมาก (สมบูรณ์)");
      t7b.updateSprayingRoundField(rId, "productResponse", respText);
      t7b.updateSprayingRoundField(rId, "effectivenessScore", "5");
      t7b.updateSprayingRoundField(rId, "satisfactionScore", "5");
      t7b.updateSprayingRoundField(
        rId,
        "farmerFeedback",
        `[TEST-${tag}] เกษตรกรประทับใจผลลัพธ์`,
      );
      t7b.updateRoundImages?.(rId, [mockRoundImg]);
    }

    snapFields["act.t7b.daysAfterSpray"] = {
      label: "จำนวนวันหลังพ่นยา (Days After Spray)",
      section: "TYPE_7B: บันทึกผลติดตามแปลงสาธิต",
      value: "7",
    };
    snapFields["act.t7b.productResponse"] = {
      label: "การตอบสนองของพืช (Product Response)",
      section: "TYPE_7B: บันทึกผลติดตามแปลงสาธิต",
      value: respText,
    };
    snapFields["act.t7b.cropImages"] = {
      label: "รูปถ่ายการติดตามแปลง (Crop Images)",
      section: "TYPE_7B: บันทึกผลติดตามแปลงสาธิต",
      value: "1 รูป",
    };
  }

  // TYPE_8
  if (activeWorkTypeCodes.includes("TYPE_8")) {
    const t8 = actualHooks.type8;
    const attendees = "48";
    const feedback = `[TEST-${tag}] เกษตรกรสอบถามอัตราการใช้และสั่งจองผ่านร้านค้าในงานทันที`;
    const mockAtmos = createMockImageFile(`T8-Atmosphere-${tag}`, 8);
    const mockReg = createMockImageFile(`T8-Registration-${tag}`, 9);

    t8.setActualAttendees?.(attendees);
    t8.setFeedbackQnA?.(feedback);
    t8.setImages?.([mockAtmos]);
    t8.setRegistrationImages?.([mockReg]);

    if (t8.productSalesDetails?.length > 0) {
      t8.setProductSalesDetails?.(
        t8.productSalesDetails.map((p: any) => ({
          ...p,
          actualQuantity: "10",
          actualSales: String(Number(p.unitPrice || 2400) * 10),
        })),
      );
    }

    snapFields["act.t8.actualAttendees"] = {
      label: "ผู้เข้าร่วมประชุมจริง (คน)",
      section: "TYPE_8: บันทึกผลจัดประชุม",
      value: attendees,
    };
    snapFields["act.t8.feedbackQnA"] = {
      label: "ผลตอบรับ / คำถาม-คำตอบ",
      section: "TYPE_8: บันทึกผลจัดประชุม",
      value: feedback,
    };
    snapFields["act.t8.images"] = {
      label: "รูปถ่ายบรรยากาศและใบลงทะเบียน",
      section: "TYPE_8: บันทึกผลจัดประชุม",
      value: "1 รูป",
    };
  }

  // TYPE_9
  if (activeWorkTypeCodes.includes("TYPE_9")) {
    const t9 = actualHooks.type9;
    const sales = "85000";
    const attendees = "65";
    const mockImg = createMockImageFile(`T9-StoreEvent-${tag}`, 9);

    t9.setActualSales?.(sales);
    t9.setActualAttendees?.(attendees);
    t9.setImages?.([mockImg]);

    if (t9.productSalesDetails?.length > 0) {
      t9.setProductSalesDetails?.(
        t9.productSalesDetails.map((p: any) => ({
          ...p,
          actualQuantity: "15",
          actualSales: String(Number(p.unitPrice || 2400) * 15),
        })),
      );
    }

    snapFields["act.t9.actualSales"] = {
      label: "ยอดขายจริงในงาน (บาท)",
      section: "TYPE_9: บันทึกผลจัดกิจกรรมหน้าร้าน",
      value: sales,
    };
    snapFields["act.t9.actualAttendees"] = {
      label: "ผู้เข้าร่วมงานจริง (คน)",
      section: "TYPE_9: บันทึกผลจัดกิจกรรมหน้าร้าน",
      value: attendees,
    };
    snapFields["act.t9.images"] = {
      label: "รูปถ่ายกิจกรรมหน้าร้าน",
      section: "TYPE_9: บันทึกผลจัดกิจกรรมหน้าร้าน",
      value: "1 รูป",
    };
  }

  // TYPE_10
  if (activeWorkTypeCodes.includes("TYPE_10")) {
    const t10 = actualHooks.type10;
    const attendees = "125";
    const sales = "140000";
    const fb = `[TEST-${tag}] เกษตรกรเห็นผลความแตกต่างของแปลงสาธิตชัดเจนและเปิดบิลหน้างาน`;
    const mockImg = createMockImageFile(`T10-FieldDay-${tag}`, 10);

    t10.setActualAttendees?.(attendees);
    t10.setActualSalesOrBooking?.(sales);
    t10.setFarmerFeedback?.(fb);
    t10.setHasSales?.(true);
    t10.setImages?.([mockImg]);
    t10.setSoldProducts?.([
      {
        id: `t10-sold-${Date.now()}`,
        productId: firstProd.id || "",
        productName: firstProd.name || "สินค้าทดสอบ",
        quantity: "25",
        unitPrice: "2400",
        totalAmount: "60000",
      },
    ]);

    snapFields["act.t10.actualAttendees"] = {
      label: "ผู้เข้าร่วมงานจริง (คน)",
      section: "TYPE_10: บันทึกผลงาน Field Day",
      value: attendees,
    };
    snapFields["act.t10.actualSalesOrBooking"] = {
      label: "ยอดจอง/ยอดขายจริงในงาน (บาท)",
      section: "TYPE_10: บันทึกผลงาน Field Day",
      value: sales,
    };
    snapFields["act.t10.farmerFeedback"] = {
      label: "ความเห็นของเกษตรกร (Farmer Feedback)",
      section: "TYPE_10: บันทึกผลงาน Field Day",
      value: fb,
    };
  }

  // TYPE_11
  if (activeWorkTypeCodes.includes("TYPE_11")) {
    const t11 = actualHooks.type11;
    const mockImg = createMockImageFile(`T11-Stock-${tag}`, 11);
    const stockItem = {
      id: `t11-stk-${Date.now()}`,
      storeId: firstStore.id || "",
      storeName: firstStore.name || "ร้านค้าทดสอบ",
      productId: firstProd.id || "",
      productName: firstProd.name || "สินค้าทดสอบ",
      remainingQty: "18",
      unit: "ลัง",
      remarks: `[TEST-${tag}] สต๊อกหมุนเวียนดี`,
      nextAction: `[TEST-${tag}] เสนอเติมสต๊อกรอบเดือนหน้า 20 ลัง`,
    };

    t11.setStockItems?.([stockItem]);
    t11.setRemainingQty?.("18");
    t11.setRemarks?.(`[TEST-${tag}] สต๊อกหมุนเวียนดี`);
    t11.setNextAction?.(`[TEST-${tag}] เสนอเติมสต๊อกรอบเดือนหน้า 20 ลัง`);
    t11.setImages?.([mockImg]);

    snapFields["act.t11.stockItems"] = {
      label: "รายการสินค้าที่ตรวจเช็คสต๊อก",
      section: "TYPE_11: บันทึกผลเช็คสต๊อกหน้าร้าน",
      value: "1 รายการ",
    };
    snapFields["act.t11.remainingQty"] = {
      label: "จำนวนคงเหลือหน้าร้าน",
      section: "TYPE_11: บันทึกผลเช็คสต๊อกหน้าร้าน",
      value: "18",
    };
    snapFields["act.t11.images"] = {
      label: "รูปถ่ายสต๊อกสินค้า",
      section: "TYPE_11: บันทึกผลเช็คสต๊อกหน้าร้าน",
      value: "1 รูป",
    };
  }

  // TYPE_13
  if (activeWorkTypeCodes.includes("TYPE_13")) {
    const t13 = actualHooks.type13;
    const mockImg = createMockImageFile(`T13-HattackSpray-${tag}`, 13);
    const basePlots =
      t13.plots?.length > 0
        ? t13.plots
        : [
            {
              id: `t13-plot-${Date.now()}`,
              farmerName: "นายสมศักดิ์ แปลงแฮตแทค",
              cropType: "นาข้าว",
            },
          ];

    const updatedPlots = basePlots.map((p: any) => ({
      ...p,
      actualPlotsCount: "3",
      areaRai: p.areaRai || "15",
      waterVolumeLiters: "200",
      sprayedAreaRai: "15",
      latitude: "14.979900",
      longitude: "102.097700",
      afterSprayImages: [mockImg],
    }));

    if (t13.setPlots) {
      t13.setPlots(updatedPlots);
    } else if (t13.updatePlot && basePlots[0]?.id) {
      t13.updatePlot(basePlots[0].id, {
        actualPlotsCount: "3",
        areaRai: "15",
        waterVolumeLiters: "200",
        sprayedAreaRai: "15",
        latitude: "14.979900",
        longitude: "102.097700",
        afterSprayImages: [mockImg],
      });
    }

    snapFields["act.t13.actualPlotsCount"] = {
      label: "จำนวนแปลงแฮตแทคที่ทำจริง",
      section: "TYPE_13: บันทึกผลทำแปลงแฮตแทค",
      value: "3",
    };
    snapFields["act.t13.coords"] = {
      label: "พิกัดแปลงแฮตแทค (Latitude / Longitude)",
      section: "TYPE_13: บันทึกผลทำแปลงแฮตแทค",
      value: "14.979900, 102.097700",
    };
    snapFields["act.t13.afterSprayImages"] = {
      label: "รูปถ่ายหลังฉีดพ่น (After Spray Images)",
      section: "TYPE_13: บันทึกผลทำแปลงแฮตแทค",
      value: "1 รูป",
    };
  }

  // TYPE_14
  if (activeWorkTypeCodes.includes("TYPE_14")) {
    const t14 = actualHooks.type14;
    const mockImg = createMockImageFile(`T14-HattackFollowup-${tag}`, 14);
    const trackText = `[TEST-${tag}] วัชพืชตายเรียบ ข้าวปลอดภัยไม่แดง เกษตรกรพึงพอใจมาก`;

    const basePlots =
      t14.plots?.length > 0
        ? t14.plots
        : [
            {
              id: `t14-plot-${Date.now()}`,
              farmerName: "นายสมศักดิ์ แปลงแฮตแทค",
              cropType: "นาข้าว",
            },
          ];

    const updatedPlots = basePlots.map((p: any) => ({
      ...p,
      daysAfterSpray: "7",
      effectivenessScore: "5",
      satisfactionScore: "5",
      trackingResult: trackText,
      farmerFeedback: trackText,
      afterSprayImages: [mockImg],
    }));

    if (t14.setPlots) {
      t14.setPlots(updatedPlots);
    } else if (t14.updatePlot && basePlots[0]?.id) {
      t14.updatePlot(basePlots[0].id, {
        daysAfterSpray: "7",
        effectivenessScore: "5",
        satisfactionScore: "5",
        trackingResult: trackText,
        farmerFeedback: trackText,
        afterSprayImages: [mockImg],
      });
    }

    snapFields["act.t14.daysAfterSpray"] = {
      label: "จำนวนวันหลังพ่นยา (Days After Spray)",
      section: "TYPE_14: บันทึกผลติดตามแปลงแฮตแทค",
      value: "7",
    };
    snapFields["act.t14.trackingResult"] = {
      label: "ผลการติดตามแปลง (Tracking Result)",
      section: "TYPE_14: บันทึกผลติดตามแปลงแฮตแทค",
      value: trackText,
    };
    snapFields["act.t14.afterSprayImages"] = {
      label: "รูปถ่ายติดตามแปลงแฮตแทค",
      section: "TYPE_14: บันทึกผลติดตามแปลงแฮตแทค",
      value: "1 รูป",
    };
  }

  saveTestSnapshot({
    mode: "ACTUAL",
    planId: plan?.id,
    planCode: plan?.code,
    title: plan?.title || "Actual Test",
    workTypeCodes: activeWorkTypeCodes,
    savedAt: new Date().toISOString(),
    fields: snapFields,
  });
}
