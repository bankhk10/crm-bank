/**
 * Credit Types
 * Type definitions for credit limit domain
 */

import type { CreditLimitStatus, TemporaryCreditStatus } from "@prisma/client";

/**
 * Credit limit summary
 */
export interface CreditLimitSummary {
  customerId: string;
  limitAmount: number;
  promoAmount: number;
  usedAmount: number;
  availableAmount: number;
  status: CreditLimitStatus;
  temporaryCreditAmount?: number;
  temporaryCreditExpiryDate?: Date;
}

/**
 * Credit check result
 */
export interface CreditCheckResult {
  hasCredit: boolean;
  availableAmount: number;
  requestedAmount: number;
  shortfall: number;
  message?: string;
}

/**
 * Temporary credit limit input
 */
export interface CreateTemporaryCreditInput {
  customerId: string;
  requestedAmount: number;
  expiryDate: Date;
  notes?: string;
  requestedById: string;
}

/**
 * Temporary credit limit response
 */
export interface TemporaryCreditLimitResponse {
  id: string;
  customerId: string;
  requestedAmount: number;
  expiryDate: Date;
  notes?: string;
  status: TemporaryCreditStatus;
  requestedAt: Date;
  approvedAt?: Date;
}

/**
 * Credit restoration result
 */
export interface CreditRestorationResult {
  success: boolean;
  restoredAmount: number;
  error?: string;
}
