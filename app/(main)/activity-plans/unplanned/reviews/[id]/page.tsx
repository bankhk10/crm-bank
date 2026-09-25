import { use } from "react";
import { UnplannedReviewDetailView } from "@/modules/activity-plans";

export const metadata = {
  title: "ตรวจสอบกิจกรรมนอกแผนงาน | CRM Bank",
  description: "ตรวจสอบรายละเอียดและผลการปฏิบัติงานของกิจกรรมนอกแผนงาน",
};

export default function UnplannedReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <UnplannedReviewDetailView id={id} />;
}
