import type { Type7bActualRecord } from "../types/actual.types";

/**
 * Parses summaryText and structured resData to restore Type7bActualRecord
 */
export function parseType7bActualResult(
  summaryText: string = "",
  resData: any = {},
): Type7bActualRecord {
  const result: Type7bActualRecord = {};

  if (!summaryText && !resData) return result;

  // 1. Structured data in resData.type7bActual
  if (resData.type7bActual) {
    Object.assign(result, resData.type7bActual);
  }

  // 2. Direct fields in resData
  if (resData.t7VisitDate && !result.t7VisitDate) {
    result.t7VisitDate = resData.t7VisitDate;
  }
  if (resData.t7DaysAfterSpray !== undefined && result.t7DaysAfterSpray === undefined) {
    result.t7DaysAfterSpray = resData.t7DaysAfterSpray;
  }
  if (resData.t7SprayingRounds && Array.isArray(resData.t7SprayingRounds) && !result.t7SprayingRounds) {
    result.t7SprayingRounds = resData.t7SprayingRounds;
  }
  if (resData.t7PlotStatus && !result.t7PlotStatus) {
    result.t7PlotStatus = resData.t7PlotStatus;
  }
  if (resData.t7NextSprayDate && !result.t7NextSprayDate) {
    result.t7NextSprayDate = resData.t7NextSprayDate;
  }
  if (resData.t7Notes && !result.t7Notes) {
    result.t7Notes = resData.t7Notes;
  }

  // 3. Parse from summary text (fallback)
  const plotNameMatch = summaryText.match(/(?:แปลงสาธิต|ชื่อแปลง):\s*(.+)/);
  if (plotNameMatch && plotNameMatch[1]) {
    result.t7PlotName = plotNameMatch[1].split("\n")[0].trim();
  }

  const farmerNameMatch = summaryText.match(/(?:เกษตรกร|เจ้าของแปลง):\s*(.+)/);
  if (farmerNameMatch && farmerNameMatch[1]) {
    result.t7FarmerName = farmerNameMatch[1].split("\n")[0].trim();
  }

  const growthMatch = summaryText.match(/(?:ระยะการเจริญเติบโต|ระยะพืช\s*\(Stage\)):\s*(.+)/);
  if (growthMatch && growthMatch[1]) {
    result.t7GrowthStage = growthMatch[1].split("\n")[0].trim();
  }

  const condMatch = summaryText.match(/สภาพแปลง:\s*(.+)/);
  if (condMatch && condMatch[1]) {
    const cVal = condMatch[1].split("\n")[0].trim();
    if (cVal === "สมบูรณ์" || cVal === "มีปัญหา" || cVal === "ปานกลาง" || cVal === "ทรุดโทรม") {
      result.t7CropCondition = cVal as any;
    }
  }

  const cropProblemMatch = summaryText.match(/(?:ปัญหาของสภาพพืช|รายละเอียดปัญหา):\s*(.+)/);
  if (cropProblemMatch && cropProblemMatch[1]) {
    result.t7CropProblemDescription = cropProblemMatch[1].split("\n")[0].trim();
  }

  const responseMatch = summaryText.match(/(?:ผลหลังการฉีดพ่น|ผลการใช้ผลิตภัณฑ์):\s*(.+)/);
  if (responseMatch && responseMatch[1]) {
    result.t7ProductResponse = responseMatch[1].split("\n")[0].trim();
  }

  const sprayMethodMatch = summaryText.match(/(?:วิธีการฉีดพ่น|วิธีพ่น):\s*(.+)/);
  if (sprayMethodMatch && sprayMethodMatch[1]) {
    result.t7SprayMethod = sprayMethodMatch[1].split("\n")[0].trim();
  }

  const sprayEquipMatch = summaryText.match(/(?:อุปกรณ์ที่ใช้ฉีดพ่น|อุปกรณ์พ่น):\s*(.+)/);
  if (sprayEquipMatch && sprayEquipMatch[1]) {
    result.t7SprayEquipment = sprayEquipMatch[1].split("\n")[0].trim();
  }

  const nextSprayMatch = summaryText.match(/(?:กำหนดฉีดพ่นครั้งต่อไป|กำหนดการติดตามครั้งถัดไป):\s*(.+)/);
  if (nextSprayMatch && nextSprayMatch[1]) {
    result.t7NextFollowUpDate = nextSprayMatch[1].split("\n")[0].trim();
    result.t7NextSprayDate = result.t7NextFollowUpDate;
  }

  // 4. Structured attachments or image files
  if (resData.t7CropImages && Array.isArray(resData.t7CropImages)) {
    result.t7CropImages = resData.t7CropImages;
  }
  if (resData.t7PlotImages && Array.isArray(resData.t7PlotImages)) {
    result.t7PlotImages = resData.t7PlotImages;
  }

  return result;
}
