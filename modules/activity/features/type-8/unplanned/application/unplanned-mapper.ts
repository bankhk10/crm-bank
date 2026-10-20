import type { Type8UnplannedItem } from "../types/unplanned.types";
import { encodeType8StoreNotes } from "../../shared/notes";
import { WORK_TYPE_CODE, WORK_TYPE_NAME } from "../../shared/constants";

/**
 * Hydrates Type 8 Unplanned Form Items from initial state or pre-existing data
 */
export function hydrateType8UnplannedData(initialData: any): Type8UnplannedItem[] {
  if (!initialData) return [];

  if (Array.isArray(initialData.type8UnplannedItems) && initialData.type8UnplannedItems.length > 0) {
    return initialData.type8UnplannedItems;
  }

  const t8 = initialData.type8 || initialData.type8Data;
  if (!t8) return [];

  const rawMeetings: any[] = t8.meetings || (t8.topic ? [t8] : []);

  if (rawMeetings.length > 0) {
    return rawMeetings.map((item, idx) => ({
      id: item.id || String(idx + 1),
      topic: item.topic || "",
      meetingTarget: item.meetingTarget || "FARMER",
      farmerChannel: item.farmerChannel || undefined,
      customerId: item.customerId || null,
      customerName: item.customerName || null,
      subdealerId: item.subdealerId || null,
      subdealerName: item.subdealerName || null,
      isNewSubdealer: Boolean(item.isNewSubdealer),
      venueType: item.venueType || "OTHER",
      location: item.location || "",
      meetingDate: item.meetingDate || "",
      meetingTime: item.meetingTime || "",
      expectedAttendees: item.expectedAttendees ?? "",
      actualAttendees: item.actualAttendees ?? "",
      promotions: item.promotions || [],
      productSalesDetails: item.productSalesDetails || [],
      feedbackQnA: item.feedbackQnA || "",
      notes: item.notes || "",
      registrationImages: item.registrationImages || [],
      images: item.images || [],
    }));
  }

  return [];
}

/**
 * Maps Type 8 Unplanned items to payload for saving plan & actual outcome together
 */
export function mapType8UnplannedToPayload(items: Type8UnplannedItem[]) {
  if (!items || items.length === 0) {
    return {
      type8Data: null,
      actualOutcome: null,
      planProducts: [],
      targets: [],
    };
  }

  const firstItem = items[0];

  const stores = items
    .filter((i) => Boolean(i.customerId))
    .map((item) => {
      const promoTexts = (item.promotions || [])
        .map((p) => p.notes || p.productName || "")
        .filter(Boolean);
      return {
        customerId: item.customerId!,
        customerName: item.customerName || undefined,
        notes: encodeType8StoreNotes(item.notes || "", promoTexts),
      };
    });

  const targets = items.map((item) => ({
    title: item.topic || WORK_TYPE_NAME,
    subtitle: item.location || item.customerName || undefined,
    detail: item.notes || undefined,
    customerId: item.customerId || undefined,
    customerName: item.customerName || undefined,
    meetingTarget: item.meetingTarget,
    farmerChannel: item.farmerChannel,
    venueType: item.venueType,
    location: item.location,
    meetingDate: item.meetingDate,
    meetingTime: item.meetingTime,
    expectedAttendees: item.expectedAttendees ? Number(item.expectedAttendees) : undefined,
    actualAttendees: item.actualAttendees ? Number(item.actualAttendees) : undefined,
    feedbackQnA: item.feedbackQnA,
    promotions: item.promotions,
    productSalesDetails: item.productSalesDetails,
  }));

  // Build Actual Summary Text
  const summaryLines: string[] = [
    `บันทึกผลการจัดประชุม (นอกแผน)`,
    `หัวข้อการประชุม: ${items.map((i) => i.topic).join(", ")}`,
    `กลุ่มเป้าหมาย: ${firstItem.meetingTarget}`,
  ];

  if (firstItem.customerName) {
    summaryLines.push(`ร้านค้าผู้แทนจำหน่าย: ${firstItem.customerName}`);
  }
  if (firstItem.subdealerName) {
    summaryLines.push(`ร้านค้ารายย่อย: ${firstItem.subdealerName}`);
  }
  if (firstItem.location) {
    summaryLines.push(`สถานที่จัดประชุม: ${firstItem.location}`);
  }
  if (firstItem.actualAttendees) {
    summaryLines.push(`จำนวนผู้เข้าร่วมประชุมจริง: ${firstItem.actualAttendees} คน`);
  }
  if (firstItem.feedbackQnA) {
    summaryLines.push(`ข้อเสนอแนะ / Q&A: ${firstItem.feedbackQnA}`);
  }

  const allRegistrationImages = items.flatMap((i) => i.registrationImages || []);
  const allAtmosphereImages = items.flatMap((i) => i.images || []);

  const allAttachments = [
    ...allRegistrationImages.map((img) => ({
      id: img.id,
      fileUrl: img.url,
      fileName: img.name || "registration-sheet.jpg",
      fileSize: img.size,
      group: "REGISTRATION",
    })),
    ...allAtmosphereImages.map((img) => ({
      id: img.id,
      fileUrl: img.url,
      fileName: img.name || "meeting-atmosphere.jpg",
      fileSize: img.size,
      group: "ATMOSPHERE",
    })),
  ];

  const actualOutcome = {
    resultStatus: "COMPLETED",
    resultSummary: summaryLines.join("\n"),
    attachments: allAttachments,
    type8Actual: {
      t8Topic: firstItem.topic,
      t8MeetingTarget: firstItem.meetingTarget,
      t8FarmerChannel: firstItem.farmerChannel,
      t8CustomerId: firstItem.customerId,
      t8CustomerName: firstItem.customerName,
      t8SubdealerId: firstItem.subdealerId,
      t8SubdealerName: firstItem.subdealerName,
      t8ActualAttendees: firstItem.actualAttendees,
      t8FeedbackQnA: firstItem.feedbackQnA,
      t8ProductSalesDetails: firstItem.productSalesDetails || [],
      t8RegistrationImages: allRegistrationImages,
      t8Images: allAtmosphereImages,
    },
  };

  const type8Data = {
    meetings: items.map((i) => ({
      topic: i.topic,
      meetingTarget: i.meetingTarget,
      farmerChannel: i.farmerChannel,
      customerId: i.customerId,
      customerName: i.customerName,
      subdealerId: i.subdealerId,
      subdealerName: i.subdealerName,
      venueType: i.venueType,
      location: i.location,
      meetingDate: i.meetingDate,
      meetingTime: i.meetingTime,
      expectedAttendees: i.expectedAttendees,
      actualAttendees: i.actualAttendees,
      notes: i.notes,
      promotions: i.promotions,
    })),
  };

  return {
    workTypeCode: WORK_TYPE_CODE,
    workTypeName: WORK_TYPE_NAME,
    type8Data,
    stores,
    targets,
    actualOutcome,
    planProducts: [],
  };
}
