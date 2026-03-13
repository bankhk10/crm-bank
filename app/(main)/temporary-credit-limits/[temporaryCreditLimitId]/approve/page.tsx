import { use } from "react";
import { TemporaryCreditLimitApproveView } from "@/modules/temporary-credit-limits";

export default function ApproveTemporaryCreditLimitPage({
  params,
}: {
  params: Promise<{ temporaryCreditLimitId: string }>;
}) {
  const { temporaryCreditLimitId } = use(params);
  return <TemporaryCreditLimitApproveView id={temporaryCreditLimitId} />;
}
