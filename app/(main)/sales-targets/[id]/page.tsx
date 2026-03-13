import { use } from "react";
import { SalesTargetDetailView } from "@/modules/sales-targets";

export default function SalesTargetDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return <SalesTargetDetailView id={id} />;
}
