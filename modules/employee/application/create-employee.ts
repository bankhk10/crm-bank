import { hash } from "bcryptjs";
import { employeeSchema } from "./validations";
import {
  findEmployeeByEmail,
  findUserByEmail,
  findRoleById,
  createEmployee,
} from "../infrastructure/employee.repository";
import { handleSignatureUpload } from "./signature-utils";

/**
 * Use case: Create a new employee (and optionally a linked User account).
 */
export async function createEmployeeUseCase(rawData: unknown) {
  // 1. Validate input
  const parsed = employeeSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // 2. Uniqueness checks
  if (data.email) {
    const existingEmp = await findEmployeeByEmail(data.email);
    if (existingEmp) {
      return {
        success: false,
        error: "อีเมลนี้ถูกใช้งานแล้วในระบบพนักงาน",
        issues: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] },
      };
    }

    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
      return {
        success: false,
        error: "อีเมลนี้ถูกใช้งานแล้วในระบบผู้ใช้",
        issues: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] },
      };
    }
  }

  // 3. Resolve role name
  let roleName: string | null = null;
  if (data.roleDefinitionId) {
    const r = await findRoleById(data.roleDefinitionId);
    if (r) roleName = r.name;
  }

  // 4. Build employee data
  const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

  const employeeData: any = {
    name: `${data.prefix ?? ""} ${data.firstName} ${data.lastName}`.trim(),
    email: data.email || undefined,
    prefix: data.prefix || undefined,
    firstName: data.firstName || undefined,
    lastName: data.lastName || undefined,
    employeeCode: data.employeeCode || undefined,
    phone: data.phone || undefined,
    birthDate: !isNaN(birthDate?.getTime() ?? NaN) ? birthDate : undefined,
    addressLine: data.addressLine || undefined,
    province: data.province || undefined,
    district: data.district || undefined,
    subdistrict: data.subdistrict || undefined,
    postalCode: data.postalCode || undefined,
    responsibilityArea: data.responsibilityArea || undefined,
    status: data.status ?? "ACTIVE",
    signature: data.signature || undefined,
    roleTitle: roleName || undefined,
    positionId: data.position || undefined,
    departmentId: data.department || undefined,
    companyId: data.company || undefined,
    managerId: data.managerId || undefined,
  };

  // 4.1 Process signature if exists
  if (data.signature) {
    employeeData.signature = await handleSignatureUpload(data.signature);
  }

  // 5. Optionally build user data
  let userData:
    | {
        name: string;
        email: string;
        password: string;
        roleId: string;
      }
    | undefined;

  if (data.email && data.password && data.roleDefinitionId) {
    const hashed = await hash(data.password, 12);
    userData = {
      name: employeeData.name,
      email: data.email,
      password: hashed,
      roleId: data.roleDefinitionId,
    };
  }

  // 6. Persist
  const result = await createEmployee({ employeeData, userData });

  return { success: true, employee: result.employee };
}
