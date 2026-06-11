import { CustomerType } from "../types";
import { getHighestCustomerCode } from "../infrastructure/customer.repository";
import { getCustomerConfig } from "../features/form/config/customer-config";

export async function generateCustomerCode(customerType: CustomerType): Promise<string> {
  const config = getCustomerConfig(customerType);
  if (!config) {
    throw new Error(`Invalid customer type: ${customerType}`);
  }

  const prefix = config.codePrefix;
  const now = new Date();
  const thaiDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const buddhistYear = thaiDate.getFullYear() + 543;
  const yearSuffix = String(buddhistYear).slice(-2);
  const month = String(thaiDate.getMonth() + 1).padStart(2, "0");

  const pattern = `${prefix}${yearSuffix}${month}`;

  const existingCustomers = await getHighestCustomerCode(pattern);

  let runningNumber = 1;

  if (existingCustomers && existingCustomers.length > 0) {
    const lastCode = existingCustomers[0].customerCode;
    const lastRunningNumber = parseInt(lastCode.slice(-4), 10);
    if (!isNaN(lastRunningNumber)) {
      runningNumber = lastRunningNumber + 1;
    }
  }

  if (runningNumber > 9999) {
    throw new Error("Maximum customer codes reached for this month");
  }

  const runningNumberStr = String(runningNumber).padStart(4, "0");
  return `${pattern}${runningNumberStr}`;
}
