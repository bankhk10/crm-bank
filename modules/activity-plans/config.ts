/**
 * Activity Plan Module Configuration
 */

/**
 * Determines whether Activity Plan Testing Mode is enabled.
 * When enabled via ACTIVITY_PLAN_TEST_MODE=true, allows recording actual results
 * without waiting for the approval process, specifically for user testing phases.
 */
export function isActivityPlanTestMode(): boolean {
  const envVal = process.env.ACTIVITY_PLAN_TEST_MODE;
  return envVal === "true" || envVal === "1";
}
