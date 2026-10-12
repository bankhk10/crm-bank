import type {
  Type7aTargetItem,
  Type7aActualRecord,
  Type7aDemoProductItem,
} from "../types";

/**
 * Extract Type 7A targets from an ActivityPlan (supporting Multi-Target Demo Plot Creation)
 */
export function extractType7aPlanTargets(
  plan: any,
  prevTarget?: Type7aTargetItem,
): {
  primary: Type7aTargetItem;
  list: Type7aTargetItem[];
} {
  const fallbackItem: Type7aTargetItem = {
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

  // 1. Primary: Extract from dedicated ActivityPlanType7a records (plan.type7aPlots)
  const rawPlots: any[] = plan?.type7aPlots || [];
  if (Array.isArray(rawPlots) && rawPlots.length > 0) {
    const list: Type7aTargetItem[] = rawPlots.map((plot: any, idx: number) => {
      const plotName = plot.plotName || plot.name || plot.demoPlot?.name || `แปลงสาธิต #${idx + 1}`;
      const ownerName =
        plot.ownerName ||
        plot.farmerName ||
        plot.demoPlot?.ownerName ||
        plot.store?.name ||
        "";
      const dealerName =
        plot.store?.name ||
        plot.demoPlot?.customer?.name ||
        "";
      const dealerCode =
        plot.store?.customerCode ||
        plot.demoPlot?.customer?.customerCode ||
        "";
      const province =
        plot.province ||
        plot.store?.province ||
        plot.demoPlot?.province ||
        plan?.province ||
        "";
      const district =
        plot.district ||
        plot.store?.district ||
        plot.demoPlot?.district ||
        plan?.district ||
        "";
      const cropCategory =
        plot.cropCategory ||
        plot.demoPlot?.cropCategory ||
        "";
      const cropName =
        plot.customCropName ||
        plot.cropName ||
        plot.demoPlot?.customCropName ||
        plot.demoPlot?.cropName ||
        "";
      const areaRai =
        plot.areaRai != null
          ? Number(plot.areaRai)
          : plot.demoPlot?.areaRai != null
            ? Number(plot.demoPlot.areaRai)
            : null;
      const treeCount =
        plot.treeCount != null
          ? Number(plot.treeCount)
          : plot.demoPlot?.treeCount != null
            ? Number(plot.demoPlot.treeCount)
            : null;
      const plotsStr = areaRai
        ? `${areaRai} ไร่`
        : treeCount
          ? `${treeCount} ต้น`
          : "";

      // Demo Products
      const rawProducts: any[] =
        plot.products && plot.products.length > 0
          ? plot.products
          : plot.demoPlot?.demoProducts && plot.demoPlot.demoProducts.length > 0
            ? plot.demoPlot.demoProducts
            : [];

      const demoProducts: Type7aDemoProductItem[] = rawProducts.map((p: any, pIdx: number) => {
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
          id: p.id || `t7a-prod-${idx}-${pIdx}`,
          productId: p.productId || prod.id,
          productName: pName,
          quantity: qty,
          targetQuantity: qty,
          unit,
        };
      });

      const firstProduct = demoProducts[0];
      const categoryName = (plot.products?.[0]?.product as any)?.category?.name || "";
      const categoryCode = (plot.products?.[0]?.product as any)?.category?.code || "";

      const itemSummary = {
        activityType: "CREATE" as const,
        owner: ownerName,
        product: firstProduct?.productName || "",
        crop: cropName,
        plots: plotsStr,
        demoProductQuantity: firstProduct ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim() : "-",
        objective: plot.objective || "",
        experimentDetail: "",
        detail: plot.notes || plot.objective || "",
      };

      return {
        id: plot.id || `t7a-target-${idx}`,
        plotName,
        owner: ownerName,
        ownerName,
        farmerName: ownerName,
        storeId: plot.storeId || plot.demoPlot?.customerId || undefined,
        dealerName,
        dealerCode,
        location: [province, district].filter(Boolean).join(" / "),
        province,
        district,
        objective: plot.objective || "",
        categoryName,
        categoryCode,
        chemicalGroupName: categoryName,
        cropCategory,
        crop: cropName,
        cropName,
        areaRai,
        treeCount,
        plots: plotsStr,
        demoProducts,
        activityType: "CREATE",
        product: firstProduct?.productName || "",
        demoProductQuantity: firstProduct ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim() : "-",
        detail: plot.notes || plot.objective || "",
        experimentDetail: "",
        items: [itemSummary],
      };
    });

    const primaryTarget: Type7aTargetItem = {
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
    const plotName = t7Plot.name || "แปลงสาธิต";
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
    const demoProducts: Type7aDemoProductItem[] = rawProducts.map((p: any, pIdx: number) => {
      const prod = p.product || {};
      const pName = p.productName || prod.name || "";
      const qty = p.quantity != null ? Number(p.quantity) : 1;
      return {
        id: p.id || `t7a-fb-prod-${pIdx}`,
        productId: p.productId || prod.id,
        productName: pName,
        quantity: qty,
        targetQuantity: qty,
        unit: p.unit || prod.unit || null,
      };
    });

    const firstProduct = demoProducts[0];
    const targetItem: Type7aTargetItem = {
      id: t7Plot.id || "t7a-target-demo-fallback",
      plotName,
      owner: ownerName,
      ownerName,
      farmerName: ownerName,
      storeId: t7Plot.customerId || undefined,
      dealerName,
      dealerCode,
      location: [province, district].filter(Boolean).join(" / "),
      province,
      district,
      objective: t7Plot.objective || "",
      cropCategory,
      crop: cropName,
      cropName,
      areaRai,
      treeCount,
      plots: plotsStr,
      demoProducts,
      activityType: "CREATE",
      product: firstProduct?.productName || t7Plot.primaryProductName || "",
      demoProductQuantity: firstProduct ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim() : "-",
      detail: t7Plot.notes || t7Plot.objective || "",
      experimentDetail: t7Plot.experimentDetail || "",
      items: [
        {
          activityType: "CREATE" as const,
          owner: ownerName,
          product: firstProduct?.productName || t7Plot.primaryProductName || "",
          crop: cropName,
          plots: plotsStr,
          demoProductQuantity: firstProduct ? `${firstProduct.quantity} ${firstProduct.unit || ""}`.trim() : "-",
          objective: t7Plot.objective || "",
          experimentDetail: t7Plot.experimentDetail || "",
          detail: t7Plot.notes || "",
        },
      ],
    };

    return {
      primary: targetItem,
      list: [targetItem],
    };
  }

  // 3. Fallback: Generic stores table (activity_plan_stores) matching TYPE_7A
  const stores: any[] = plan?.planStores || plan?.stores || [];
  const t7aStores = stores.filter(
    (s) => s.workTypeCode === "TYPE_7A" || s.workTypeCode === "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)",
  );

  if (t7aStores.length > 0) {
    const list: Type7aTargetItem[] = t7aStores.map((s, idx) => {
      const storeName = s.store?.name || s.storeName || "";
      const item: Type7aTargetItem = {
        id: s.id || `t7a-store-fallback-${idx}`,
        plotName: s.storeName || `แปลงสาธิต #${idx + 1}`,
        owner: storeName,
        ownerName: storeName,
        storeId: s.storeId || undefined,
        dealerName: storeName,
        dealerCode: s.store?.customerCode || "",
        province: s.province || plan?.province || "",
        district: plan?.district || "",
        objective: s.notes || "",
        detail: s.notes || "",
        items: [
          {
            activityType: "CREATE" as const,
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
 * Parse Type 7A Actual Results from raw backend ActivityResult payload
 */
export function parseType7aActualResult(resData: any): Partial<Type7aActualRecord> {
  const result: Partial<Type7aActualRecord> = {};
  if (!resData) return result;

  const summaryText = resData.resultSummary || "";

  // 1. Text Parsing from summaryText
  const farmerMatch = summaryText.match(/เกษตรกรเจ้าของแปลง:\s*(.+)/);
  if (farmerMatch && farmerMatch[1]) {
    let rawFarmer = farmerMatch[1].split("\n")[0].trim();
    if (rawFarmer.includes("(ไม่มีในระบบ)")) {
      result.t7IsUnregisteredFarmer = true;
      rawFarmer = rawFarmer.replace("(ไม่มีในระบบ)", "").trim();
    }
    const provMatch = rawFarmer.match(/จ\.([^\s]+)/);
    if (provMatch && provMatch[1]) {
      result.t7FarmerProvince = provMatch[1].trim();
      rawFarmer = rawFarmer.replace(provMatch[0], "").trim();
    }
    const distMatch = rawFarmer.match(/อ\.([^\s]+)/);
    if (distMatch && distMatch[1]) {
      result.t7FarmerDistrict = distMatch[1].trim();
      rawFarmer = rawFarmer.replace(distMatch[0], "").trim();
    }
    result.t7FarmerName = rawFarmer;
  }

  const farmerPhoneMatch = summaryText.match(/เบอร์โทรศัพท์เกษตรกร:\s*(.+)/);
  if (farmerPhoneMatch && farmerPhoneMatch[1]) {
    result.t7FarmerPhone = farmerPhoneMatch[1].split("\n")[0].trim();
  }

  const demoCoordsMatch = summaryText.match(/พิกัดแปลงสาธิต:\s*([-\d.]+),\s*([-\d.]+)/);
  if (demoCoordsMatch && demoCoordsMatch[1] && demoCoordsMatch[2]) {
    result.t7Latitude = Number(demoCoordsMatch[1]);
    result.t7Longitude = Number(demoCoordsMatch[2]);
  }

  const testCropMatch = summaryText.match(/พืชที่ทดสอบ:\s*(.+)/);
  if (testCropMatch && testCropMatch[1]) {
    const cropLine = testCropMatch[1].split("\n")[0].trim();
    const catMatch = cropLine.match(/\((.+?)\)$/);
    if (catMatch && catMatch[1]) {
      result.t7CropCategory = catMatch[1].trim();
      result.t7CropName = cropLine.replace(catMatch[0], "").trim();
    } else {
      result.t7CropName = cropLine;
    }
  }

  const areaRaiMatch = summaryText.match(/ขนาดพื้นที่แปลง:\s*([0-9.]+)\s*ไร่/);
  if (areaRaiMatch && areaRaiMatch[1]) {
    result.t7AreaRai = areaRaiMatch[1].trim();
  }

  const treeCountMatch = summaryText.match(/จำนวนต้น:\s*([0-9]+)\s*ต้น/);
  if (treeCountMatch && treeCountMatch[1]) {
    result.t7TreeCount = treeCountMatch[1].trim();
  }

  const mainCropInfoMatch = summaryText.match(/ข้อมูลพืชประธาน:\s*(.+)/);
  if (mainCropInfoMatch && mainCropInfoMatch[1]) {
    result.t7MainCropInfo = mainCropInfoMatch[1].split("\n")[0].trim();
  }

  const initialSprayMatch = summaryText.match(/วันที่ฉีดพ่น:\s*(.+)/);
  if (initialSprayMatch && initialSprayMatch[1]) {
    result.t7InitialSprayDate = initialSprayMatch[1].split("\n")[0].trim();
  }

  const irrigationsMatch = summaryText.match(/ระบบน้ำ:\s*(.+)/);
  if (irrigationsMatch && irrigationsMatch[1]) {
    const irrStr = irrigationsMatch[1].split("\n")[0].trim();
    result.t7Irrigations = irrStr.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  const expDetailMatch = summaryText.match(/วิธีการทดลอง:\s*(.+)/);
  if (expDetailMatch && expDetailMatch[1]) {
    result.t7ExperimentDetail = expDetailMatch[1].split("\n")[0].trim();
  }

  const demoProductsMatch = summaryText.match(/สินค้าสาธิต:\s*(.+)/);
  if (demoProductsMatch && demoProductsMatch[1]) {
    const prodLine = demoProductsMatch[1].split("\n")[0].trim();
    const rawItems = prodLine.split(/,\s*(?=[^,()]+\s*\(เบิก:)/);
    const parsedItems = rawItems
      .map((itemStr: string, idx: number) => {
        const itemMatch = itemStr.trim().match(
          /^(.+?)\s*\(\s*เบิก:\s*([^,]+),\s*ใช้จริง:\s*([0-9.]+)(?:\s+([^,]+?))?(?:,\s*คงเหลือ:\s*([0-9.]+))?\)(?:\s*อัตราใช้:\s*(.*))?$/
        );
        if (itemMatch) {
          const pName = itemMatch[1].trim();
          const rawPlanQty = itemMatch[2].trim();
          const plannedQty = rawPlanQty === "-" ? null : Number(rawPlanQty);
          const usedQty = Number(itemMatch[3].trim()) || 0;
          const unit = itemMatch[4]?.trim() || "";
          const remainingQty = itemMatch[5] != null ? Number(itemMatch[5].trim()) : null;
          const applicationRate = itemMatch[6]?.trim() || "";
          return {
            id: `parsed-t7a-${idx + 1}`,
            productName: pName,
            plannedQuantity: plannedQty,
            quantity: usedQty,
            remainingQuantity: remainingQty,
            unit,
            applicationRate,
            isAdditional: plannedQty == null || rawPlanQty === "-",
          };
        }
        return null;
      })
      .filter(Boolean);
    if (parsedItems.length > 0) {
      result.t7DemoProducts = parsedItems;
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
 * Format Type 7A Plots for detail view section display
 */
export function mapType7aToSectionItems(plots: any[]): Array<{
  title: string;
  subtitle?: string;
  details?: string;
  extraFields?: Array<{ label: string; value: string }>;
}> {
  if (!plots || plots.length === 0) return [];

  return plots.map((p, idx) => {
    const title = p.plotName || p.name || p.demoPlot?.name || `แปลงสาธิต #${idx + 1}`;
    const ownerName = p.ownerName || p.farmerName || p.demoPlot?.ownerName || p.store?.name;
    const cropName = p.customCropName || p.cropName || p.demoPlot?.customCropName || p.demoPlot?.cropName;
    const areaRai = p.areaRai != null ? Number(p.areaRai) : (p.demoPlot?.areaRai != null ? Number(p.demoPlot.areaRai) : null);
    const treeCount = p.treeCount ?? p.demoPlot?.treeCount ?? null;

    const extraFields: Array<{ label: string; value: string }> = [];
    if (cropName) {
      extraFields.push({ label: "พืชเป้าหมาย", value: cropName });
    }
    if (areaRai) {
      extraFields.push({ label: "ขนาดแปลง", value: `${areaRai} ไร่` });
    } else if (treeCount) {
      extraFields.push({ label: "จำนวนต้น", value: `${treeCount} ต้น` });
    }

    const products = p.products || p.demoPlot?.demoProducts || [];
    if (products.length > 0) {
      const prodNames = products
        .map((pr: any) => pr.productName || pr.product?.name)
        .filter(Boolean)
        .join(", ");
      if (prodNames) {
        extraFields.push({ label: "สินค้าสาธิต", value: prodNames });
      }
    }

    return {
      title,
      subtitle: ownerName ? `เจ้าของ: ${ownerName}` : undefined,
      details: p.objective || p.demoPlot?.objective || undefined,
      extraFields: extraFields.length > 0 ? extraFields : undefined,
    };
  });
}
