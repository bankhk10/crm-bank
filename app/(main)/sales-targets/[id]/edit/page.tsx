import { use } from "react";
import { SalesTargetEditView } from "@/modules/sales-targets";

export default function EditSalesTargetPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return <SalesTargetEditView id={id} />;
}
