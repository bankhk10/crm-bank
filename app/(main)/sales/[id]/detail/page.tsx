import { use } from "react";
import { SaleDetailView } from "@/modules/sales/features/detail-view/sale-detail-view";

export const metadata = {
    title: "รายละเอียดการขาย",
    description: "ดูข้อมูลรายละเอียดรายการขาย",
};

export default function SaleDetailMobilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return <SaleDetailView id={id} />;
}
