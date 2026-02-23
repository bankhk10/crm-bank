import { z } from "zod";

export const addressSchema = z.object({
  addressLine: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  subdistrict: z.string().nullable().optional(),
  postalCode: z
    .union([z.string(), z.number()])
    .transform((v) => (v ? String(v) : undefined))
    .nullable()
    .optional(),
});

export const employeeSchema = z.object({
  prefix: z.string().nullable().optional(),
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  employeeCode: z.string().nullable().optional(),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  responsibilityArea: z.string().nullable().optional(),
  addressLine: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  subdistrict: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  roleDefinitionId: z.string().min(1, "กรุณาเลือกสิทธิ์การใช้งาน"),
  password: z.string().optional(),
});

export const employeeUpdateSchema = employeeSchema.partial().extend({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
export type EmployeeUpdateFormValues = z.infer<typeof employeeUpdateSchema>;
