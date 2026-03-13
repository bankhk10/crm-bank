import { use } from "react";
import { TemporaryCreditLimitDetailView } from "@/modules/temporary-credit-limits";

export default function ViewTemporaryCreditLimitPage({
  params,
}: {
  params: Promise<{ temporaryCreditLimitId: string }>;
}) {
  const { temporaryCreditLimitId } = use(params);
  return <TemporaryCreditLimitDetailView id={temporaryCreditLimitId} />;
}
