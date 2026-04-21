import { use } from "react";
import { SaleDetailMobileView } from "@/modules/sales/features/detail-view/sale-detail-mobile-view";

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

    return <SaleDetailMobileView id={id} />;
}
