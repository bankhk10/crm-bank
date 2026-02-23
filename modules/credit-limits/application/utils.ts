import type { CustomerRecord } from "../types";

export function calculateCreditInfo(r: CustomerRecord) {
  const cl = r.creditLimits && r.creditLimits[0];

  if (!cl) {
    return {
      hasCreditLimit: false,
      totalRemaining: 0,
      promoAmount: 0,
      tempLimitAmount: 0,
      isTempExpired: false,
      latestTempExpiry: null,
      creditLimitId: null,
    };
  }

  // Base credit remaining (without temporary credit)
  const baseAmount =
    cl.availableAmount !== undefined
      ? Number(cl.availableAmount)
      : Number(cl.limitAmount) - (Number(cl.usedAmount) || 0);

  const totalRemaining = baseAmount;

  const tempLimits = r.temporaryCreditLimits || [];
  const approvedLimits = tempLimits.filter(
    (temp) => temp.status === "APPROVED",
  );

  let tempLimitAmount = 0;
  let isTempExpired = false;
  let latestTempExpiry: Date | null = null;

  if (approvedLimits.length > 0) {
    // Sort desc
    const latestTemp = approvedLimits.sort((a, b) => {
      const dateA = new Date(a.expiryDate).getTime();
      const dateB = new Date(b.expiryDate).getTime();
      return dateB - dateA;
    })[0];

    const expiryDate = new Date(latestTemp.expiryDate);
    latestTempExpiry = expiryDate;
    const now = new Date();

    if (expiryDate >= now) {
      tempLimitAmount = Number(latestTemp.requestedAmount);
    } else {
      isTempExpired = true;
    }
  }

  return {
    hasCreditLimit: true,
    totalRemaining,
    promoAmount: Number(cl.promoAmount || 0),
    tempLimitAmount,
    isTempExpired,
    latestTempExpiry,
    creditLimitId: cl.id,
  };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
}
