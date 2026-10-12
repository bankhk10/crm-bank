import type {
  Type7bTargetItem,
  Type7bActualRecord,
  Type7bWithdrawnProductLine,
} from "../types";

/**
 * Extract Type 7B targets from an ActivityPlan (supporting Multi-Target Demo Plot Follow-up)
 */
export function extractType7bPlanTargets(
  plan: any,
  prevTarget?: Type7bTargetItem,
): {
  primary: Type7bTargetItem;
  list: Type7bTargetItem[];
} {
  const fallbackItem: Type7bTargetItem = {
    plotName: "",
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "-",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
    ...prevTarget,
  };

  // 1. Primary: Extract from dedicated ActivityPlanType7b record and its plots/products
  const t7bRecord: any = plan?.type7b || plan?.type7bData;
  const rawPlots: any[] = t7bRecord?.plots || [];

  if (t7bRecord && Array.isArray(rawPlots) && rawPlots.length > 0) {
    // Withdrawn products linked to Type 7B
    const t7bProducts: Type7bWithdrawnProductLine[] = (t7bRecord.products || []).map(
      (p: any, idx: number) => {
        const prod = p.product || {};
        const pName = p.productName || prod.name || "";
        const qty =
          p.quantity != null
            ? Number(p.quantity)
            : p.targetQuantity != null
              ? Number(p.targetQuantity)
              : 1;
        const unit = p.unit || prod.unit || null;
        return {
          id: p.id || `t7b-prod-${idx}`,
          productId: p.productId || prod.id,
          productName: pName,
          quantity: qty,
          unit,
          notes: p.notes || "",
        };
      },
    );

    const list: Type7bTargetItem[] = rawPlots.map((plot: any, idx: number) => {
      const demoPlot = plot.demoPlot || {};
      const plotName =
        plot.plotName ||
        demoPlot.name ||
        `แปลงสาธิตติดตาม #${idx + 1}`;
      const ownerName =
        plot.ownerName ||
        plot.farmerName ||
        demoPlot.ownerName ||
        "";
      const dealerName =
        plot.dealerName ||
        demoPlot.customer?.name ||
        demoPlot.dealerName ||
        "";
      const dealerCode =
        demoPlot.customer?.customerCode ||
        demoPlot.dealerCode ||
        "";
      const province =
        plot.province ||
        demoPlot.province ||
        plan?.province ||
        "";
      const district =
        plot.district ||
        demoPlot.district ||
        plan?.district ||
        "";
      const cropCategory =
        demoPlot.cropCategory ||
        "";
      const cropName =
        plot.cropName ||
        demoPlot.customCropName ||
        demoPlot.cropName ||
        "";
      const areaRai =
        plot.areaRai != null
          ? Number(plot.areaRai)
          : demoPlot.areaRai != null
            ? Number(demoPlot.areaRai)
            : null;
      const treeCount =
        plot.treeCount != null
          ? Number(plot.treeCount)
          : demoPlot.treeCount != null
            ? Number(demoPlot.treeCount)
            : null;
      const plotsStr = areaRai
        ? `${areaRai} ไร่`
        : treeCount
          ? `${treeCount} ต้น`
          : "";

      // Fallback to demoPlot's products if 7B has no dedicated withdrawn products
      const plotProducts =
        t7bProducts.length > 0
          ? t7bProducts
          : (demoPlot.demoProducts || []).map((dp: any, dpIdx: number) => ({
              id: dp.id || `dp-prod-${dpIdx}`,
              productId: dp.productId || dp.product?.id,
              productName: dp.productName || dp.product?.name || "",
              quantity: dp.quantity != null ? Number(dp.quantity) : 1,
              unit: dp.unit || dp.product?.unit || null,
            }));

      const firstProduct = plotProducts[0];
      const objectiveText =
        t7bRecord.objective ||
        t7bRecord.notes ||
        plan?.objective ||
        "";

      const itemSummary = {
        activityType: "FOLLOW_UP" as const,
        owner: ownerName,
        product: firstProduct?.productName || "",
        crop: cropName,
        plots: plotsStr,
        demoProductQuantity: firstProduct
          ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim()
          : "-",
        objective: objectiveText,
        experimentDetail: demoPlot.experimentDetail || "",
        detail: objectiveText,
      };

      return {
        id: plot.id || `t7b-target-${idx}`,
        demoPlotId: plot.demoPlotId || demoPlot.id,
        plotName,
        plotCode: demoPlot.code || "",
        owner: ownerName,
        ownerName,
        farmerName: ownerName,
        dealerName,
        dealerCode,
        location: [province, district].filter(Boolean).join(" / "),
        province,
        district,
        cropCategory,
        crop: cropName,
        cropName,
        areaRai,
        treeCount,
        plots: plotsStr,
        objective: objectiveText,
        detail: objectiveText,
        activityType: "FOLLOW_UP",
        product: firstProduct?.productName || "",
        productId: firstProduct?.productId,
        plannedProductId: firstProduct?.productId,
        demoProductQuantity: firstProduct
          ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim()
          : "-",
        demoProducts: plotProducts,
        withdrawnProducts: t7bProducts,
        experimentDetail: demoPlot.experimentDetail || "",
        items: [itemSummary],
      };
    });

    const primaryTarget: Type7bTargetItem = {
      ...list[0],
      items: list.flatMap((l) => l.items || []),
    };

    return {
      primary: primaryTarget,
      list,
    };
  }

  // 2. Fallback: Check demoPlotVisits or plan.demoPlot
  const demoVisits: any[] = plan?.demoPlotVisits || [];
  const t7Plot = plan?.demoPlot || demoVisits[0]?.demoPlot;
  if (t7Plot) {
    const plotName = t7Plot.name || "แปลงสาธิตติดตาม";
    const ownerName = t7Plot.ownerName || "";
    const dealerName = t7Plot.customer?.name || "";
    const dealerCode = t7Plot.customer?.customerCode || "";
    const province = t7Plot.province || plan?.province || "";
    const district = t7Plot.district || plan?.district || "";
    const cropCategory = t7Plot.cropCategory || "";
    const cropName = t7Plot.customCropName || t7Plot.cropName || "";
    const areaRai = t7Plot.areaRai != null ? Number(t7Plot.areaRai) : null;
    const treeCount = t7Plot.treeCount != null ? Number(t7Plot.treeCount) : null;
    const plotsStr = areaRai ? `${areaRai} ไร่` : treeCount ? `${treeCount} ต้น` : "";

    const rawProducts: any[] = t7Plot.demoProducts || [];
    const demoProducts: any[] = rawProducts.map((p: any, pIdx: number) => {
      const prod = p.product || {};
      const pName = p.productName || prod.name || "";
      const qty = p.quantity != null ? Number(p.quantity) : 1;
      return {
        id: p.id || `t7b-fb-prod-${pIdx}`,
        productId: p.productId || prod.id,
        productName: pName,
        quantity: qty,
        targetQuantity: qty,
        unit: p.unit || prod.unit || null,
      };
    });

    const firstProduct = demoProducts[0];
    const objectiveText =
      t7bRecord?.objective ||
      t7bRecord?.notes ||
      t7Plot.objective ||
      plan?.objective ||
      "";

    const targetItem: Type7bTargetItem = {
      id: t7Plot.id || "t7b-target-demo-fallback",
      demoPlotId: t7Plot.id,
      plotName,
      plotCode: t7Plot.code || "",
      owner: ownerName,
      ownerName,
      farmerName: ownerName,
      dealerName,
      dealerCode,
      location: [province, district].filter(Boolean).join(" / "),
      province,
      district,
      objective: objectiveText,
      cropCategory,
      crop: cropName,
      cropName,
      areaRai,
      treeCount,
      plots: plotsStr,
      demoProducts,
      withdrawnProducts: demoProducts,
      activityType: "FOLLOW_UP",
      product: firstProduct?.productName || t7Plot.primaryProductName || "",
      productId: firstProduct?.productId,
      plannedProductId: firstProduct?.productId,
      demoProductQuantity: firstProduct
        ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim()
        : "-",
      detail: objectiveText,
      experimentDetail: t7Plot.experimentDetail || "",
      items: [
        {
          activityType: "FOLLOW_UP" as const,
          owner: ownerName,
          product: firstProduct?.productName || t7Plot.primaryProductName || "",
          crop: cropName,
          plots: plotsStr,
          demoProductQuantity: firstProduct
            ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim()
            : "-",
          objective: objectiveText,
          experimentDetail: t7Plot.experimentDetail || "",
          detail: objectiveText,
        },
      ],
    };

    return {
      primary: targetItem,
      list: [targetItem],
    };
  }

  // 3. Fallback: Generic stores table (activity_plan_stores) matching TYPE_7B
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const t7bStores = stores.filter(
    (s) => s.workTypeCode === "TYPE_7B" || s.workTypeCode === "ติดตามแปลงสาธิต",
  );

  if (t7bStores.length > 0) {
    const list: Type7bTargetItem[] = t7bStores.map((s, idx) => {
      const storeName = s.store?.name || s.storeName || "";
      const item: Type7bTargetItem = {
        id: s.id || `t7b-store-fallback-${idx}`,
        plotName: s.storeName || `แปลงสาธิตติดตาม #${idx + 1}`,
        owner: storeName,
        ownerName: storeName,
        storeId: s.storeId || undefined,
        dealerName: storeName,
        dealerCode: s.store?.customerCode || "",
        province: s.province || plan?.province || "",
        district: plan?.district || "",
        objective: s.notes || "",
        detail: s.notes || "",
        activityType: "FOLLOW_UP",
        items: [
          {
            activityType: "FOLLOW_UP" as const,
            owner: storeName,
            product: "",
            crop: "",
            plots: "",
            demoProductQuantity: "-",
            objective: s.notes || "",
            experimentDetail: "",
            detail: s.notes || "",
          },
        ],
      };
      return item;
    });

    return {
      primary: list[0],
      list,
    };
  }

  return {
    primary: fallbackItem,
    list: [],
  };
}

/**
 * Parse Type 7B Actual Results from raw backend ActivityResult payload
 */
export function parseType7bActualResult(resData: any): Partial<Type7bActualRecord> {
  const result: Partial<Type7bActualRecord> = {};
  if (!resData) return result;

  const summaryText = resData.resultSummary || "";

  // 1. Text Parsing from summaryText
  const t7PlotMatch = summaryText.match(/(?:ชื่อแปลงทดสอบ|ชื่อแปลงสาธิต):\s*(.+)/);
  if (t7PlotMatch && t7PlotMatch[1]) {
    result.t7PlotName = t7PlotMatch[1].split("\n")[0].trim();
  }

  const t7MethodMatch = summaryText.match(/(?:วิธีใช้\/อัตราการใช้|ข้อมูลเพิ่มเติม):\s*(.+)/);
  if (t7MethodMatch && t7MethodMatch[1]) {
    result.t7UsageMethod = t7MethodMatch[1].split("\n")[0].trim();
    result.t7Notes = result.t7UsageMethod;
  }

  const t7ExpMatch = summaryText.match(/(?:วิธีการทดลอง|วิธีการทดลอง\s*\/\s*แผนการทดสอบ):\s*(.+)/);
  if (t7ExpMatch && t7ExpMatch[1]) {
    result.t7ExperimentDetail = t7ExpMatch[1].split("\n")[0].trim();
  }

  const t7AgeMatch = summaryText.match(/(?:อายุพืช|อายุพืช\s*\(วันหลังปลูก\)):\s*(\d+)\s*(วัน|สัปดาห์|เดือน|ปี)?/);
  if (t7AgeMatch && t7AgeMatch[1]) {
    result.t7CropAgeValue = t7AgeMatch[1].trim();
    if (t7AgeMatch[2]) {
      result.t7CropAgeUnit = t7AgeMatch[2].trim();
    }
  }

  const t7GrowthMatch = summaryText.match(/(?:ระยะการเจริญเติบโต|ระยะพืช\s*\(Stage\)):\s*(.+)/);
  if (t7GrowthMatch && t7GrowthMatch[1]) {
    result.t7GrowthStage = t7GrowthMatch[1].split("\n")[0].trim();
  }

  const t7CondMatch = summaryText.match(/สภาพแปลง:\s*(.+)/);
  if (t7CondMatch && t7CondMatch[1]) {
    const cVal = t7CondMatch[1].split("\n")[0].trim();
    if (cVal === "สมบูรณ์" || cVal === "มีปัญหา" || cVal === "ปานกลาง" || cVal === "ทรุดโทรม") {
      result.t7CropCondition = cVal as any;
    }
  }

  const t7DescMatch = summaryText.match(/(?:ปัญหาของสภาพพืช|รายละเอียดแปลง):\s*(.+)/);
  if (t7DescMatch && t7DescMatch[1]) {
    result.t7CropProblemDescription = t7DescMatch[1].split("\n")[0].trim();
  }

  const t7ResponseMatch = summaryText.match(/(?:ผลหลังการฉีดพ่น|ผลการใช้ผลิตภัณฑ์):\s*(.+)/);
  if (t7ResponseMatch && t7ResponseMatch[1]) {
    const resp = t7ResponseMatch[1].split("\n")[0].trim();
    if (resp === "พืชตอบสนองดี" || resp === "พบปัญหา") {
      result.t7ProductResponse = resp;
    }
  }

  const t7ProblemMatch = summaryText.match(/(?:รายละเอียดปัญหาหลังการฉีดพ่น|รายละเอียดปัญหาการใช้ผลิตภัณฑ์|รายละเอียดปัญหา):\s*(.+)/);
  if (t7ProblemMatch && t7ProblemMatch[1]) {
    result.t7ProblemDescription = t7ProblemMatch[1].split("\n")[0].trim();
  }

  const customPlotMatch = summaryText.match(/รายละเอียดแปลง:\s*(.+)/);
  if (customPlotMatch && customPlotMatch[1]) {
    result.t7CustomPlotDetail = customPlotMatch[1].split("\n")[0].trim();
    if (!result.t7DemoPlotId) result.t7DemoPlotId = "OTHER";
  }

  if (summaryText.includes("แปลงเกษตร: แปลงอื่นๆ") && !result.t7DemoPlotId) {
    result.t7DemoPlotId = "OTHER";
  }

  const plantingDateMatch = summaryText.match(/(?:วันที่เริ่มปลูกจริง|วันที่ปลูก):\s*(.+)/);
  if (plantingDateMatch && plantingDateMatch[1]) {
    result.t7PlantingDate = plantingDateMatch[1].split("\n")[0].trim();
  }

  const areaCondMatch = summaryText.match(/(?:สภาพพื้นที่ปลูกตอนเริ่มต้น|สภาพพื้นที่ปลูก|ข้อมูลพืชประธาน):\s*(.+)/);
  if (areaCondMatch && areaCondMatch[1]) {
    result.t7PlantingAreaCondition = areaCondMatch[1].split("\n")[0].trim();
  }

  const statusMatch = summaryText.match(/สถานะแปลง:\s*(.+)/);
  if (statusMatch && statusMatch[1]) {
    const s = statusMatch[1].split("\n")[0].trim();
    if (s === "IN_PROGRESS" || s === "COMPLETED" || s === "FAILED") {
      result.t7PlotStatus = s as any;
    }
  }

  const nextVisitMatch = summaryText.match(/(?:กำหนดฉีดพ่นครั้งต่อไป|กำหนดการติดตามครั้งถัดไป):\s*(.+)/);
  if (nextVisitMatch && nextVisitMatch[1]) {
    result.t7NextFollowUpDate = nextVisitMatch[1].split("\n")[0].trim();
    result.t7NextSprayDate = result.t7NextFollowUpDate;
  }

  const actualVisitDateMatch = summaryText.match(/วันที่ติดตามจริง:\s*(.+)/);
  if (actualVisitDateMatch && actualVisitDateMatch[1]) {
    result.actualStartDate = actualVisitDateMatch[1].split("\n")[0].trim();
    result.t7StartDate = result.actualStartDate;
  }

  const daysAfterSprayMatch = summaryText.match(/จำนวนวันหลังฉีดพ่น:\s*(\d+)/);
  if (daysAfterSprayMatch && daysAfterSprayMatch[1]) {
    result.t7DaysAfterSpray = daysAfterSprayMatch[1].trim();
  }

  const sprayEquipMatch = summaryText.match(/อุปกรณ์ที่ใช้ฉีดพ่น:\s*([^\n(]+)(?:\s*\(([^)]+)\))?/);
  if (sprayEquipMatch && sprayEquipMatch[1]) {
    result.t7SprayEquipment = sprayEquipMatch[1].trim();
    if (sprayEquipMatch[2]) {
      result.t7OtherEquipment = sprayEquipMatch[2].trim();
    }
  }

  const sprayMethodMatch = summaryText.match(/(?:วิธีการฉีดพ่น|รูปแบบการฉีดพ่น):\s*(.+)/);
  if (sprayMethodMatch && sprayMethodMatch[1]) {
    const sVal = sprayMethodMatch[1].split("\n")[0].trim();
    if (sVal.includes("ผสมถัง") || sVal.includes("TANK_MIXED") || sVal.includes("Tank-mixed")) {
      result.t7SprayMethod = "TANK_MIXED";
    } else if (sVal.includes("ฉีดเดี่ยว") || sVal.includes("SINGLE") || sVal.includes("Single")) {
      result.t7SprayMethod = "SINGLE";
    }
  }

  const extChemMatch = summaryText.match(/(?:ยาภายนอก|สารเคมีภายนอก):\s*(.+)/);
  if (extChemMatch && extChemMatch[1]) {
    result.t7HasExternalChemicals = true;
    const extStr = extChemMatch[1].split("\n")[0].trim();
    if (extStr.startsWith("[") && extStr.endsWith("]")) {
      try {
        result.t7ExternalProducts = JSON.parse(extStr);
      } catch {
        // ignore
      }
    } else {
      const rawExtItems = extStr.split(/,\s*(?=[^,]+?\s*-\s*[^,]+?\[)/);
      const parsedExt = rawExtItems
        .map((itemStr: string) => {
          const m = itemStr.trim().match(
            /^(.+?)\s*-\s*(.+?)(?:\s*\{([^}]+)\})?\s*\[(.+?)\]\s*\((.+?)\)$/,
          );
          if (m) {
            const company = m[1].trim();
            const productName = m[2].trim();
            const activeIngredient = m[3]?.trim() || "";
            let formula = m[4].trim();
            let customFormula = "";
            if (formula.startsWith("อื่นๆ") || formula.includes("(")) {
              const cfMatch = formula.match(/อื่นๆ\s*\((.+)\)/);
              if (cfMatch) {
                customFormula = cfMatch[1].trim();
                formula = "อื่นๆ";
              }
            }
            const applicationRate = m[5].trim();
            return {
              company,
              productName,
              activeIngredient,
              formula,
              customFormula,
              applicationRate,
            };
          }
          return null;
        })
        .filter(Boolean);
      if (parsedExt.length > 0) {
        result.t7ExternalProducts = parsedExt;
      }
    }
  }

  const yieldMatch = summaryText.match(/ผลผลิตแปลงสาธิต:\s*(.+)/);
  if (yieldMatch && yieldMatch[1]) {
    result.t7FinalYieldKg = yieldMatch[1].replace(/[^0-9.]/g, "");
  }

  const controlMatch = summaryText.match(/ผลผลิตแปลงควบคุม:\s*(.+)/);
  if (controlMatch && controlMatch[1]) {
    result.t7ControlYieldKg = controlMatch[1].replace(/[^0-9.]/g, "");
  }

  const incMatch = summaryText.match(/%\s*ผลผลิตเพิ่มขึ้น:\s*(.+)/);
  if (incMatch && incMatch[1]) {
    result.t7YieldIncreasePercent = incMatch[1].replace(/[^0-9.]/g, "");
  }

  const satMatch = summaryText.match(/ความพึงพอใจเกษตรกร:\s*(\d)/);
  if (satMatch && satMatch[1]) {
    result.t7FarmerSatisfaction = parseInt(satMatch[1]) || 5;
  }

  const comMatch = summaryText.match(/โอกาสสั่งซื้อจริง:\s*(.+)/);
  if (comMatch && comMatch[1]) {
    result.t7CommercialPotential = comMatch[1].split("\n")[0].trim();
  }

  const finalNotesMatch = summaryText.match(
    /(?:สรุปผลสัมฤทธิ์(?:แปลง)?|รายละเอียดการยุติการทดลอง|สาเหตุการยุติการทดลอง):\s*(.+)/,
  );
  if (finalNotesMatch && finalNotesMatch[1]) {
    result.t7FinalSummaryNotes = finalNotesMatch[1].split("\n")[0].trim();
  }

  const t7CropImagesMatch = summaryText.match(
    /(?:รูปภาพสภาพพืช|ภาพถ่ายสภาพพืช|รูปสภาพพืช|t7CropImages):\s*(\[.+\])/,
  );
  if (t7CropImagesMatch && t7CropImagesMatch[1]) {
    try {
      const parsed = JSON.parse(t7CropImagesMatch[1]);
      if (Array.isArray(parsed)) result.t7CropImages = parsed;
    } catch {
      // ignore
    }
  }

  const t7PlotImagesMatch = summaryText.match(
    /(?:รูปภาพสภาพแปลง|ภาพถ่ายสภาพแปลง|รูปสภาพแปลง|t7PlotImages):\s*(\[.+\])/,
  );
  if (t7PlotImagesMatch && t7PlotImagesMatch[1]) {
    try {
      const parsed = JSON.parse(t7PlotImagesMatch[1]);
      if (Array.isArray(parsed)) result.t7PlotImages = parsed;
    } catch {
      // ignore
    }
  }

  // 2. Structured data from resData.demoResults
  if (Array.isArray(resData.demoResults) && resData.demoResults.length > 0) {
    result.t7DemoResults = resData.demoResults;
    const firstDemo = resData.demoResults[0];
    if (firstDemo) {
      result.t7PlannedProductId = firstDemo.plannedProductId || null;
      result.t7ActualProductId = firstDemo.actualProductId || null;
      result.t7PlannedProductName = firstDemo.plannedProduct?.name || null;
      result.t7ActualProductName = firstDemo.actualProduct?.name || null;
      result.t7ChangeReason = firstDemo.changeReason || null;
      result.t7PlotObjective = firstDemo.plotObjective || null;
      result.t7DemoPlotId = firstDemo.demoPlotId || null;
    }
  }

  return result;
}

/**
 * Format Type 7B Follow-Up Plots for detail view section display
 */
export function mapType7bToSectionItems(
  type7b: any,
  demoVisits?: any[],
): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  if (!type7b && (!demoVisits || demoVisits.length === 0)) return [];

  const plots = type7b?.plots || [];
  if (plots.length > 0) {
    return plots.map((p: any, idx: number) => {
      const demoPlot = p.demoPlot || {};
      const title =
        p.plotName ||
        demoPlot.name ||
        `แปลงสาธิตติดตาม #${idx + 1}`;
      const ownerName =
        p.ownerName ||
        p.farmerName ||
        demoPlot.ownerName;
      const cropName =
        p.cropName ||
        demoPlot.customCropName ||
        demoPlot.cropName;
      const areaRai =
        p.areaRai != null
          ? Number(p.areaRai)
          : demoPlot.areaRai != null
            ? Number(demoPlot.areaRai)
            : null;
      const treeCount = p.treeCount ?? demoPlot.treeCount ?? null;

      const extraFields: Array<{ label: string; value: string }> = [];
      if (cropName) {
        extraFields.push({ label: "พืชเป้าหมาย", value: cropName });
      }
      if (areaRai) {
        extraFields.push({ label: "ขนาดแปลง", value: `${areaRai} ไร่` });
      } else if (treeCount) {
        extraFields.push({ label: "จำนวนต้น", value: `${treeCount} ต้น` });
      }

      const dealerName = p.dealerName || demoPlot.customer?.name;
      if (dealerName) {
        extraFields.push({ label: "ร้านค้าตัวแทน", value: dealerName });
      }

      // Products from 7B
      const products = type7b?.products || demoPlot.demoProducts || [];
      if (products.length > 0) {
        const prodNames = products
          .map((pr: any) => pr.productName || pr.product?.name)
          .filter(Boolean)
          .join(", ");
        if (prodNames) {
          extraFields.push({ label: "สินค้าสาธิตที่เบิก/ใช้", value: prodNames });
        }
      }

      return {
        title,
        subtitle: ownerName ? `เจ้าของ: ${ownerName}` : undefined,
        details: type7b?.objective || type7b?.notes || demoPlot.objective || undefined,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  // Fallback to demoVisits
  if (demoVisits && demoVisits.length > 0) {
    return demoVisits.map((v: any, idx: number) => {
      const dp = v.demoPlot || {};
      const title = dp.name || `แปลงสาธิตติดตาม #${idx + 1}`;
      const ownerName = dp.ownerName;
      const cropName = dp.customCropName || dp.cropName;
      const areaRai = dp.areaRai != null ? Number(dp.areaRai) : null;

      const extraFields: Array<{ label: string; value: string }> = [];
      if (cropName) {
        extraFields.push({ label: "พืชเป้าหมาย", value: cropName });
      }
      if (areaRai) {
        extraFields.push({ label: "ขนาดแปลง", value: `${areaRai} ไร่` });
      }
      if (dp.customer?.name) {
        extraFields.push({ label: "ร้านค้าตัวแทน", value: dp.customer.name });
      }

      return {
        title,
        subtitle: ownerName ? `เจ้าของ: ${ownerName}` : undefined,
        details: v.notes || dp.objective || undefined,
        extraFields: extraFields.length > 0 ? extraFields : undefined,
      };
    });
  }

  return [];
}
