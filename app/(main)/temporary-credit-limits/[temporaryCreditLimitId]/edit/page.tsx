import { use } from "react";
import { TemporaryCreditLimitEditView } from "@/modules/temporary-credit-limits";

export default function EditTemporaryCreditLimitPage({
  params,
}: {
  params: Promise<{ temporaryCreditLimitId: string }>;
}) {
  const { temporaryCreditLimitId } = use(params);
  return <TemporaryCreditLimitEditView id={temporaryCreditLimitId} />;
}
