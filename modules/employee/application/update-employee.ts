import { hash } from "bcryptjs";
import { employeeUpdateSchema } from "./validations";
import {
  findEmployeeById,
  findRoleById,
  updateEmployee,
} from "../infrastructure/employee.repository";
import { handleSignatureUpload } from "./signature-utils";


/**
 * Use case: Update an existing employee (and optionally sync linked User account).
 */
export async function updateEmployeeUseCase(id: string, rawData: unknown) {
  // 1. Validate input
  const parsed = employeeUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid payload",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // 2. Check existence
  const existingEmployee = await findEmployeeById(id);
  if (!existingEmployee) {
    return { success: false, error: "Employee not found" };
  }

  // 3. Resolve role name
  let roleName: string | null = null;
  if (data.roleDefinitionId) {
    const r = await findRoleById(data.roleDefinitionId);
    if (r) roleName = r.name;
  }

  // 4. Build employee update data
  const birthDate = data.birthDate ? new Date(data.birthDate) : undefined;

  const employeeData: any = {
    name: `${data.prefix ?? ""} ${data.firstName ?? existingEmployee.firstName ?? ""} ${data.lastName ?? existingEmployee.lastName ?? ""}`.trim(),
    email: data.email ?? undefined,
    prefix: data.prefix ?? undefined,
    firstName: data.firstName ?? undefined,
    lastName: data.lastName ?? undefined,
    employeeCode: data.employeeCode ?? undefined,
    nickname: data.nickname ?? undefined,
    phone: data.phone ?? undefined,
    birthDate: birthDate && !isNaN(birthDate.getTime()) ? birthDate : undefined,
    addressLine: data.addressLine ?? undefined,
    province: data.province ?? undefined,
    district: data.district ?? undefined,
    subdistrict: data.subdistrict ?? undefined,
    postalCode: data.postalCode ?? undefined,
    responsibilityArea: data.responsibilityArea ?? undefined,
    status: data.status ?? undefined,
  };

  if (data.signature !== undefined) {
    employeeData.signature = await handleSignatureUpload(data.signature);
  }

  if (roleName) employeeData.roleTitle = roleName;

  // Convert empty strings to null for relations
  employeeData.positionId = data.position === "" ? null : data.position;
  employeeData.departmentId = data.department === "" ? null : data.department;
  employeeData.companyId = data.company === "" ? null : data.company;
  employeeData.managerId = data.managerId === "" ? null : data.managerId;

  // 5. Optionally build user update data
  let userData:
    | {
        userId: string;
        email?: string;
        password?: string;
        name?: string;
        roleDefinitionId?: string;
      }
    | undefined;

  if (existingEmployee.user) {
    userData = {
      userId: existingEmployee.user.id,
      name: employeeData.name,
      roleDefinitionId: data.roleDefinitionId,
    };
    if (data.email) userData.email = data.email;
    if (data.password) userData.password = await hash(data.password, 12);
  }

  // 6. Persist
  await updateEmployee(id, { employeeData, userData });

  return { success: true };
}
