import type {
  Type7bActualRecord,
  Type7bSprayRoundState,
  Type7bBaselineProductItem,
  Type7bAdditionalProductItem,
} from "../types/actual.types";

/**
 * Helper to safely extract ISO Date string (YYYY-MM-DD)
 */
function toDateStr(d: any): string | undefined {
  if (!d) return undefined;
  if (typeof d === "string") {
    const match = d.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const parsed = new Date(d);
    return !isNaN(parsed.getTime()) ? parsed.toISOString().split("T")[0] : undefined;
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return undefined;
}

/**
 * Parses summaryText and structured resData / Prisma models to restore Type7bActualRecord
 * Supports both signatures:
 * - parseType7bActualResult(summaryText, resData)
 * - parseType7bActualResult(resData)
 */
export function parseType7bActualResult(
  summaryTextOrResData: any = "",
  secondArg?: any,
): Type7bActualRecord {
  const result: Type7bActualRecord = {};

  let summaryText = "";
  let resData: any = {};

  if (typeof summaryTextOrResData === "string") {
    summaryText = summaryTextOrResData;
    resData = secondArg || {};
  } else if (typeof summaryTextOrResData === "object" && summaryTextOrResData !== null) {
    resData = summaryTextOrResData;
    summaryText = secondArg || resData?.resultSummary || "";
  }

  if (!summaryText && !resData) return result;

  // 1. Structured data in resData.type7bActual or resData.type7bResults / plan.type7bResults
  const t7bDedicatedResult =
    resData.type7bResults?.[0] ||
    resData.activityPlan?.type7bResults?.[0] ||
    resData.plan?.type7bResults?.[0];

  if (t7bDedicatedResult) {
    if (t7bDedicatedResult.plotStatus) result.t7PlotStatus = t7bDedicatedResult.plotStatus;
    if (t7bDedicatedResult.visitDate) result.t7VisitDate = toDateStr(t7bDedicatedResult.visitDate);
    if (t7bDedicatedResult.daysSinceStart != null) result.t7DaysAfterSpray = String(t7bDedicatedResult.daysSinceStart);
    if (t7bDedicatedResult.cropCondition) result.t7CropCondition = t7bDedicatedResult.cropCondition;
    if (t7bDedicatedResult.growthStage) result.t7GrowthStage = t7bDedicatedResult.growthStage;
    if (t7bDedicatedResult.productResponse) result.t7ProductResponse = t7bDedicatedResult.productResponse;
    if (t7bDedicatedResult.cropProblemDesc) result.t7CropProblemDescription = t7bDedicatedResult.cropProblemDesc;
    if (t7bDedicatedResult.productProblemDesc) result.t7ProblemDescription = t7bDedicatedResult.productProblemDesc;
    if (t7bDedicatedResult.nextSprayDate) result.t7NextSprayDate = toDateStr(t7bDedicatedResult.nextSprayDate);
    if (t7bDedicatedResult.finalHarvestDate) result.t7FinalHarvestDate = toDateStr(t7bDedicatedResult.finalHarvestDate);
    if (t7bDedicatedResult.demoYieldKg != null) result.t7FinalYieldKg = String(t7bDedicatedResult.demoYieldKg);
    if (t7bDedicatedResult.controlYieldKg != null) result.t7ControlYieldKg = String(t7bDedicatedResult.controlYieldKg);
    if (t7bDedicatedResult.farmerSatisfaction != null) result.t7FarmerSatisfaction = Number(t7bDedicatedResult.farmerSatisfaction);
    if (t7bDedicatedResult.commercialPotential) result.t7CommercialPotential = t7bDedicatedResult.commercialPotential;
    if (t7bDedicatedResult.finalSummaryNotes) result.t7FinalSummaryNotes = t7bDedicatedResult.finalSummaryNotes;
    if (t7bDedicatedResult.notes) result.t7Notes = t7bDedicatedResult.notes;

    if (Array.isArray(t7bDedicatedResult.sprayRounds) && t7bDedicatedResult.sprayRounds.length > 0) {
      result.t7SprayingRounds = t7bDedicatedResult.sprayRounds.map((r: any, rIdx: number) => ({
        roundNumber: r.roundNumber || rIdx + 1,
        sprayDate: toDateStr(r.sprayDate) || "",
        sprayMethod: r.sprayMethod || "SINGLE",
        hasExternalChemicals: Boolean(r.hasExternalChemicals),
        sprayEquipment: r.sprayEquipment || "",
        otherEquipment: r.otherEquipment || "",
        productResponse: r.productResponse || "",
        problemDetail: r.problemDetail || "",
        baselineProducts: (r.sprayProducts || [])
          .filter((sp: any) => sp.isPlanned)
          .map((sp: any) => {
            const extraUnit = sp.unit?.includes("ซอง") ? "กรัม" : "ซีซี";
            const extraQtyStr =
              sp.extraQuantity != null && String(sp.extraQuantity).trim() !== ""
                ? String(sp.extraQuantity)
                : undefined;
            return {
              productId: sp.productId,
              productName: sp.productName || sp.product?.name || "",
              plannedQuantity: sp.withdrawnQuantity != null ? Number(sp.withdrawnQuantity) : undefined,
              withdrawnQuantity: sp.withdrawnQuantity != null ? Number(sp.withdrawnQuantity) : undefined,
              actualQuantity: sp.actualQuantity != null ? Number(sp.actualQuantity) : 0,
              quantityUsed: sp.actualQuantity != null ? Number(sp.actualQuantity) : 0,
              extraQuantity: extraQtyStr,
              extraUnit,
              applicationRate: sp.actualRate || "",
              actualRate: sp.actualRate || "",
              plannedRate: "ตามแผน",
              unit: sp.unit || sp.product?.unit || "",
            };
          }),
        additionalProducts: (r.sprayProducts || [])
          .filter((sp: any) => !sp.isPlanned)
          .map((sp: any, spIdx: number) => {
            const extraUnit = sp.unit?.includes("ซอง") ? "กรัม" : "ซีซี";
            const extraQtyStr =
              sp.extraQuantity != null && String(sp.extraQuantity).trim() !== ""
                ? String(sp.extraQuantity)
                : undefined;
            return {
              id: sp.id || `add-${r.id || rIdx}-${sp.productId || spIdx}`,
              productId: sp.productId,
              productName: sp.productName || sp.product?.name || "",
              actualQuantity: sp.actualQuantity != null ? Number(sp.actualQuantity) : 0,
              quantityUsed: sp.actualQuantity != null ? Number(sp.actualQuantity) : 0,
              extraQuantity: extraQtyStr,
              extraUnit,
              applicationRate: sp.actualRate || "",
              actualRate: sp.actualRate || "",
              unit: sp.unit || sp.product?.unit || "",
            };
          }),
        externalProducts: (r.sprayExternals || []).map((ext: any) => ({
          company: ext.company || "",
          productName: ext.productName || "",
          activeIngredient: ext.activeIngredient || "",
          formula: ext.formula || "SL",
          customFormula: ext.customFormula || "",
          applicationRate: ext.applicationRate || "",
        })),
        roundImages: (t7bDedicatedResult.attachments || [])
          .filter((att: any) => att.category === "PLOT" || att.workTypeCode === "TYPE_7B")
          .map((att: any, attIdx: number) => ({
            id: att.id || `att-${attIdx}`,
            url: att.fileUrl || att.url,
            name: att.fileName || "รูปภาพการฉีดพ่น",
            size: att.fileSize || 0,
            type: att.mimeType || "image/jpeg",
          })),
      }));
    }
  }

  if (resData.type7bActual && typeof resData.type7bActual === "object") {
    Object.assign(result, resData.type7bActual);
  }

  // Resolve related models from resData / activityPlan
  const plan = resData.activityPlan || resData.plan || (resData.type7b ? resData : null);
  const resultObj = resData.result || resData.actualResult || resData;

  const demoPlot =
    resData.demoPlot ||
    plan?.type7b?.plots?.[0]?.demoPlot ||
    plan?.type7bPlots?.[0]?.demoPlot ||
    plan?.type7bPlots?.[0] ||
    plan?.demoPlots?.[0] ||
    plan?.demoPlot ||
    null;

  const visits =
    plan?.demoPlotVisits ||
    resData.demoPlotVisits ||
    demoPlot?.visits ||
    resData.visits ||
    [];
  const latestVisit =
    Array.isArray(visits) && visits.length > 0 ? visits[visits.length - 1] : null;

  const allAttachments =
    resData.attachments ||
    resultObj.attachments ||
    plan?.attachments ||
    [];

  const dbSprayRounds =
    resultObj.sprayRounds ||
    resData.sprayRounds ||
    plan?.result?.sprayRounds ||
    resData.activityResultSprayRounds ||
    [];

  const plannedProductsList =
    plan?.type7b?.products ||
    plan?.type7bProducts ||
    resData.plannedProducts ||
    [];

  // 2. Reconstruct Spraying Rounds from DB relations if not already in result.t7SprayingRounds
  if (!result.t7SprayingRounds || result.t7SprayingRounds.length === 0) {
    if (Array.isArray(dbSprayRounds) && dbSprayRounds.length > 0) {
      const plannedProdMap = new Map<string, any>();
      plannedProductsList.forEach((pp: any) => {
        const pid = pp.productId || pp.product?.id || pp.id;
        if (pid) plannedProdMap.set(pid, pp);
      });

      const reconstructedRounds: Type7bSprayRoundState[] = dbSprayRounds.map((sr: any, idx: number) => {
        const roundId = sr.id || `round-${idx + 1}`;
        const roundNumber = sr.roundNumber || idx + 1;
        const sprayDate =
          toDateStr(sr.sprayDate) ||
          toDateStr(latestVisit?.visitDate) ||
          new Date().toISOString().split("T")[0];
        const sprayMethod = sr.sprayMethod || "SINGLE";
        const sprayEquipment =
          sr.sprayEquipment || "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)";
        const otherEquipment = sr.otherEquipment || "";
        const productResponse = sr.productResponse || "พืชตอบสนองดี (เห็นผลตามเป้าหมาย)";
        const problemDetail = sr.problemDetail || "";

        const prods = sr.products || [];
        const baselineProducts: Type7bBaselineProductItem[] = [];
        const additionalProducts: Type7bAdditionalProductItem[] = [];

        prods.forEach((p: any, pIdx: number) => {
          const prodId = p.productId || p.product?.id || "";
          const prodName = p.productName || p.product?.name || "";
          const unit = p.unit || p.product?.unit || "ขวด";
          const qtyUsed =
            p.actualQuantity != null
              ? Number(p.actualQuantity)
              : p.quantityUsed != null
                ? Number(p.quantityUsed)
                : 1;
          const actualRate = p.actualRate || p.applicationRate || "";
          const detail = p.detail || "";

          // Parse extraQuantity & extraUnit from extraQuantity column or detail string (e.g. "ใช้เพิ่ม 50 ซีซี")
          let extraQuantity =
            p.extraQuantity != null && String(p.extraQuantity).trim() !== ""
              ? String(p.extraQuantity)
              : "";
          let extraUnit = unit?.includes("ซอง") ? "กรัม" : "ซีซี";
          if (!extraQuantity && detail) {
            const match = detail.match(/ใช้เพิ่ม\s+([\d.]+)\s*(ซีซี|กรัม|ขวด|ซอง)?/);
            if (match) {
              extraQuantity = match[1];
              if (match[2]) extraUnit = match[2];
            }
          }

          // Determine if baseline vs additional product
          const isBaseline =
            typeof p.isPlanned === "boolean"
              ? p.isPlanned
              : (p.baselineRate !== null && p.baselineRate !== undefined) ||
                (plannedProdMap.has(prodId) && !baselineProducts.some((bp) => bp.productId === prodId));

          if (isBaseline) {
            const plannedItem = plannedProdMap.get(prodId);
            const withdrawnQty =
              p.withdrawnQuantity != null
                ? Number(p.withdrawnQuantity)
                : plannedItem?.quantity != null
                  ? Number(plannedItem.quantity)
                  : p.plannedQuantity != null
                    ? Number(p.plannedQuantity)
                    : qtyUsed;

            baselineProducts.push({
              productId: prodId,
              productName: prodName || plannedItem?.productName || "สินค้าตามแผน",
              withdrawnQuantity: withdrawnQty,
              plannedQuantity: withdrawnQty,
              actualQuantity: qtyUsed,
              quantityUsed: qtyUsed,
              extraQuantity,
              extraUnit,
              applicationRate: actualRate,
              plannedRate: p.baselineRate || plannedItem?.notes || "ตามแผน",
              actualRate,
              unit,
              detail: detail || (extraQuantity ? `ใช้เพิ่ม ${extraQuantity} ${extraUnit}` : ""),
            });
          } else {
            additionalProducts.push({
              id: p.id || `add-${roundId}-${pIdx}`,
              productId: prodId,
              productName: prodName,
              actualQuantity: qtyUsed,
              quantityUsed: qtyUsed,
              extraQuantity,
              extraUnit,
              applicationRate: actualRate,
              actualRate,
              unit,
              detail: detail || (extraQuantity ? `ใช้เพิ่ม ${extraQuantity} ${extraUnit}` : ""),
            });
          }
        });

        // Ensure planned baseline products not explicitly recorded are still listed
        plannedProductsList.forEach((pp: any) => {
          const pid = pp.productId || pp.product?.id || pp.id;
          if (pid && !baselineProducts.some((bp) => bp.productId === pid)) {
            const pName = pp.productName || pp.product?.name || "สินค้าตามแผน";
            const wQty = pp.quantity != null ? Number(pp.quantity) : 1;
            const pUnit = pp.unit || pp.product?.unit || "ขวด";
            baselineProducts.push({
              productId: pid,
              productName: pName,
              withdrawnQuantity: wQty,
              plannedQuantity: wQty,
              actualQuantity: wQty,
              extraQuantity: "",
              extraUnit: pUnit.includes("ซอง") ? "กรัม" : "ซีซี",
              applicationRate: "",
              plannedRate: "",
              actualRate: "",
              unit: pUnit,
              detail: "",
            });
          }
        });

        // External chemical products (Tank-mixed)
        const hasExternalChemicals = Boolean(
          sr.hasExternalChemicals ??
            (Array.isArray(sr.externalProducts) && sr.externalProducts.length > 0)
        );
        const externalProducts = Array.isArray(sr.externalProducts)
          ? sr.externalProducts.map((ext: any, extIdx: number) => ({
              id: ext.id || `ext-${roundId}-${extIdx}`,
              company: ext.company || "",
              productName: ext.productName || "",
              activeIngredient: ext.activeIngredient || "",
              formula: ext.formula || "SL",
              customFormula: ext.customFormula || "",
              applicationRate: ext.applicationRate || "",
            }))
          : [];

        // Round attachments
        const roundAttachments =
          Array.isArray(sr.attachments) && sr.attachments.length > 0
            ? sr.attachments
            : allAttachments.filter((a: any) => a.sprayRoundId === sr.id);

        let roundImages: any[] = [];
        if (roundAttachments.length > 0) {
          roundImages = roundAttachments.map((a: any, aIdx: number) => ({
            id: a.id || `r-img-${aIdx}`,
            url: a.fileUrl || a.url,
            name: a.fileName || a.name || `ภาพการฉีดพ่นรอบที่ ${roundNumber}`,
            size: a.fileSize || a.size || 0,
            type: a.mimeType || a.type || "image/jpeg",
          }));
        } else if (Array.isArray(sr.roundImages) && sr.roundImages.length > 0) {
          roundImages = sr.roundImages;
        }

        return {
          id: roundId,
          roundNumber,
          sprayDate,
          sprayMethod,
          sprayEquipment,
          otherEquipment,
          hasExternalChemicals,
          externalProducts,
          productResponse,
          problemDetail,
          baselineProducts,
          additionalProducts,
          roundImages,
        };
      });

      result.t7SprayingRounds = reconstructedRounds;
    } else if (resData.t7SprayingRounds && Array.isArray(resData.t7SprayingRounds)) {
      result.t7SprayingRounds = resData.t7SprayingRounds;
    }
  }

  // 3. Section 1: Tracking Details
  if (!result.t7VisitDate) {
    result.t7VisitDate =
      resData.t7VisitDate ||
      toDateStr(latestVisit?.visitDate) ||
      toDateStr(dbSprayRounds[0]?.sprayDate) ||
      toDateStr(resData.actualStartDate);
  }

  if (result.t7DaysAfterSpray === undefined) {
    result.t7DaysAfterSpray =
      resData.t7DaysAfterSpray ??
      latestVisit?.daysSinceStart ??
      dbSprayRounds[0]?.daysSinceStart ??
      0;
  }

  if (!result.t7CropCondition) {
    result.t7CropCondition =
      resData.t7CropCondition ||
      latestVisit?.cropCondition ||
      "สมบูรณ์";
  }

  if (!result.t7GrowthStage) {
    result.t7GrowthStage =
      resData.t7GrowthStage ||
      latestVisit?.growthStage ||
      "";
  }

  if (!result.t7CropProblemDescription) {
    result.t7CropProblemDescription =
      resData.t7CropProblemDescription ||
      latestVisit?.cropProblemDesc ||
      dbSprayRounds[0]?.problemDetail ||
      "";
  }

  if (!result.t7ProblemDescription) {
    result.t7ProblemDescription =
      resData.t7ProblemDescription ||
      latestVisit?.productProblemDesc ||
      "";
  }

  // Section 1: Crop and Plot images
  if (!result.t7CropImages || result.t7CropImages.length === 0) {
    if (resData.t7CropImages && Array.isArray(resData.t7CropImages)) {
      result.t7CropImages = resData.t7CropImages;
    } else {
      const cropUrls = latestVisit?.cropImageUrls || [];
      if (cropUrls.length > 0) {
        result.t7CropImages = cropUrls.map((url: string, idx: number) => ({
          id: `crop-img-${idx}`,
          url,
          name: "ภาพการเจริญเติบโตของพืช",
        }));
      } else {
        const cropAtts = allAttachments.filter(
          (a: any) =>
            !a.sprayRoundId &&
            (a.category === "CROP" || a.category === "PLOT" || a.category === "INITIAL") &&
            !a.fileName?.includes("ภาพการฉีดพ่นรอบที่"),
        );
        if (cropAtts.length > 0) {
          result.t7CropImages = cropAtts.map((a: any, idx: number) => ({
            id: a.id || `crop-att-${idx}`,
            url: a.fileUrl || a.url,
            name: a.fileName || a.name || "ภาพการเจริญเติบโตของพืช",
          }));
        }
      }
    }
  }

  if (!result.t7PlotImages || result.t7PlotImages.length === 0) {
    if (resData.t7PlotImages && Array.isArray(resData.t7PlotImages)) {
      result.t7PlotImages = resData.t7PlotImages;
    } else {
      const plotUrls = latestVisit?.plotImageUrls || [];
      if (plotUrls.length > 0) {
        result.t7PlotImages = plotUrls.map((url: string, idx: number) => ({
          id: `plot-img-${idx}`,
          url,
          name: "ภาพสภาพแปลงสาธิต",
        }));
      }
    }
  }

  // 4. Section 3: Demo Plot Status & Closure
  if (!result.t7PlotStatus) {
    result.t7PlotStatus =
      resData.t7PlotStatus ||
      demoPlot?.status ||
      "IN_PROGRESS";
  }

  if (!result.t7NextSprayDate) {
    result.t7NextSprayDate =
      resData.t7NextSprayDate ||
      toDateStr(demoPlot?.nextSprayDate) ||
      "";
  }

  if (!result.t7Notes) {
    result.t7Notes =
      resData.t7Notes ||
      dbSprayRounds[0]?.notes ||
      latestVisit?.notes ||
      resultObj?.notes ||
      demoPlot?.finalSummaryNotes ||
      "";
  }

  if (!result.t7FinalYieldKg) {
    if (demoPlot?.demoYieldKg != null) {
      result.t7FinalYieldKg = String(demoPlot.demoYieldKg);
    } else if (resData.t7FinalYieldKg != null) {
      result.t7FinalYieldKg = String(resData.t7FinalYieldKg);
    }
  }

  if (!result.t7ControlYieldKg) {
    if (demoPlot?.controlYieldKg != null) {
      result.t7ControlYieldKg = String(demoPlot.controlYieldKg);
    } else if (resData.t7ControlYieldKg != null) {
      result.t7ControlYieldKg = String(resData.t7ControlYieldKg);
    }
  }

  if (result.t7FarmerSatisfaction == null) {
    result.t7FarmerSatisfaction =
      resData.t7FarmerSatisfaction ??
      demoPlot?.farmerSatisfaction ??
      5;
  }

  if (!result.t7CommercialPotential) {
    result.t7CommercialPotential =
      resData.t7CommercialPotential ||
      demoPlot?.commercialPotential ||
      "สูง (เกษตรกรสนใจมาก)";
  }

  if (!result.t7FinalSummaryNotes) {
    result.t7FinalSummaryNotes =
      resData.t7FinalSummaryNotes ||
      demoPlot?.finalSummaryNotes ||
      "";
  }

  if (!result.t7FinalHarvestDate && demoPlot?.finalHarvestDate) {
    result.t7FinalHarvestDate = toDateStr(demoPlot.finalHarvestDate);
  }

  // Plot Context
  if (!result.t7DemoPlotId) {
    result.t7DemoPlotId = resData.t7DemoPlotId || demoPlot?.id;
  }
  if (!result.t7PlotName) {
    result.t7PlotName = resData.t7PlotName || demoPlot?.name;
  }
  if (!result.t7FarmerName) {
    result.t7FarmerName = resData.t7FarmerName || demoPlot?.ownerName;
  }
  if (!result.t7CropName) {
    result.t7CropName =
      resData.t7CropName || demoPlot?.cropName || demoPlot?.customCropName;
  }

  // 5. Parse from summary text (fallback regex)
  if (summaryText) {
    const plotNameMatch = summaryText.match(/(?:แปลงสาธิต|ชื่อแปลง):\s*(.+)/);
    if (plotNameMatch && plotNameMatch[1] && !result.t7PlotName) {
      result.t7PlotName = plotNameMatch[1].split("\n")[0].trim();
    }

    const farmerNameMatch = summaryText.match(/(?:เกษตรกร|เจ้าของแปลง):\s*(.+)/);
    if (farmerNameMatch && farmerNameMatch[1] && !result.t7FarmerName) {
      result.t7FarmerName = farmerNameMatch[1].split("\n")[0].trim();
    }

    const growthMatch = summaryText.match(/(?:ระยะการเจริญเติบโต|ระยะพืช\s*\(Stage\)):\s*(.+)/);
    if (growthMatch && growthMatch[1] && !result.t7GrowthStage) {
      result.t7GrowthStage = growthMatch[1].split("\n")[0].trim();
    }

    const condMatch = summaryText.match(/สภาพแปลง:\s*(.+)/);
    if (condMatch && condMatch[1] && !result.t7CropCondition) {
      const cVal = condMatch[1].split("\n")[0].trim();
      if (cVal === "สมบูรณ์" || cVal === "มีปัญหา" || cVal === "ปานกลาง" || cVal === "ทรุดโทรม") {
        result.t7CropCondition = cVal as any;
      }
    }

    const cropProblemMatch = summaryText.match(/(?:ปัญหาของสภาพพืช|รายละเอียดปัญหา):\s*(.+)/);
    if (cropProblemMatch && cropProblemMatch[1] && !result.t7CropProblemDescription) {
      result.t7CropProblemDescription = cropProblemMatch[1].split("\n")[0].trim();
    }

    const responseMatch = summaryText.match(/(?:ผลหลังการฉีดพ่น|ผลการใช้ผลิตภัณฑ์):\s*(.+)/);
    if (responseMatch && responseMatch[1] && !result.t7ProductResponse) {
      result.t7ProductResponse = responseMatch[1].split("\n")[0].trim();
    }

    const sprayMethodMatch = summaryText.match(/(?:วิธีการฉีดพ่น|วิธีพ่น):\s*(.+)/);
    if (sprayMethodMatch && sprayMethodMatch[1] && !result.t7SprayMethod) {
      result.t7SprayMethod = sprayMethodMatch[1].split("\n")[0].trim();
    }

    const sprayEquipMatch = summaryText.match(/(?:อุปกรณ์ที่ใช้ฉีดพ่น|อุปกรณ์พ่น):\s*(.+)/);
    if (sprayEquipMatch && sprayEquipMatch[1] && !result.t7SprayEquipment) {
      result.t7SprayEquipment = sprayEquipMatch[1].split("\n")[0].trim();
    }

    const nextSprayMatch = summaryText.match(/(?:กำหนดฉีดพ่นครั้งต่อไป|กำหนดการติดตามครั้งถัดไป):\s*(.+)/);
    if (nextSprayMatch && nextSprayMatch[1] && !result.t7NextSprayDate) {
      result.t7NextFollowUpDate = nextSprayMatch[1].split("\n")[0].trim();
      result.t7NextSprayDate = result.t7NextFollowUpDate;
    }
  }

  return result;
}
