/**
 * Application Layer – Public Facade
 *
 * Re-exports use cases and validation schemas for the employee feature.
 * Small use cases are defined inline; larger ones are in separate files.
 */

import {
  findEmployeeById,
  findEmployees,
  findAllEmployees,
  type ListEmployeesParams,
} from "../infrastructure/employee.repository";

// ─────────────────────────────────────────────
// Use Cases (inline – thin wrappers)
// ─────────────────────────────────────────────

/**
 * Use case: Get a single employee's detail by ID.
 */
export async function getEmployeeDetailUseCase(id: string) {
  const employee = await findEmployeeById(id);
  if (!employee) {
    return { success: false as const, error: "Not found" };
  }
  return { success: true as const, employee };
}

/**
 * Use case: List employees with pagination & filtering.
 */
export async function listEmployeesUseCase(params: ListEmployeesParams) {
  return findEmployees(params);
}

/**
 * Use case: List all employees (for dropdowns, selectors, etc.)
 */
export async function listAllEmployeesUseCase() {
  const employees = await findAllEmployees();
  return { success: true, employees };
}

// ─────────────────────────────────────────────
// Use Cases (separate files – have meaningful logic)
// ─────────────────────────────────────────────

export { createEmployeeUseCase } from "./create-employee";
export { updateEmployeeUseCase } from "./update-employee";

// ─────────────────────────────────────────────
// Validations & Types
// ─────────────────────────────────────────────

export {
  employeeSchema,
  employeeUpdateSchema,
  addressSchema,
  type EmployeeFormValues,
  type EmployeeUpdateFormValues,
} from "./validations";
