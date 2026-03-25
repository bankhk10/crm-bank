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

  // Read temporary credit directly from CreditLimit (no approval needed)
  const tempAmount = Number(cl.temporaryCreditAmount || 0);
  const tempExpiryDate = cl.temporaryCreditExpiryDate
    ? new Date(cl.temporaryCreditExpiryDate)
    : null;

  let tempLimitAmount = 0;
  let isTempExpired = false;
  let latestTempExpiry: Date | null = null;

  if (tempAmount > 0 && tempExpiryDate) {
    latestTempExpiry = tempExpiryDate;
    const now = new Date();
    if (tempExpiryDate >= now) {
      tempLimitAmount = tempAmount;
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
