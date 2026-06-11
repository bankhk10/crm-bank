import { customerUpdateSchema } from "./validations";
import { getRegionByProvince } from "@/lib/province-region-mapping";
import {
  updateCustomer,
  findCustomerById,
} from "../infrastructure/customer.repository";

export async function updateCustomerUseCase(id: string, input: any) {
  const normalizedBody =
    input && typeof input === "object" ? { ...input } : input;

  if (normalizedBody && typeof normalizedBody === "object") {
    const nb = normalizedBody as Record<string, unknown>;
    if (typeof nb.postalCode === "number") {
      nb.postalCode = String(nb.postalCode);
    }
    if (typeof nb.billingPostalCode === "number") {
      nb.billingPostalCode = String(nb.billingPostalCode);
    }
    if (typeof nb.shippingPostalCode === "number") {
      nb.shippingPostalCode = String(nb.shippingPostalCode);
    }
  }

  const parsed = customerUpdateSchema.safeParse(normalizedBody);

  if (!parsed.success) {
    throw new Error(
      JSON.stringify({
        message: "Invalid payload",
        issues: parsed.error.flatten().fieldErrors,
      }),
    );
  }

  const existingCustomer = await findCustomerById(id);

  if (!existingCustomer) {
    throw new Error("Not found");
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  delete updateData.images; // Images are managed separately, do not pass to Prisma

  if (typeof updateData.province === "string") {
    updateData.region = getRegionByProvince(updateData.province as string);
  } else if (updateData.province === null) {
    updateData.region = null;
  }

  if (updateData.birthDate !== undefined) {
    const v = updateData.birthDate;
    if (v === "" || v === null) {
      updateData.birthDate = null;
    } else if (typeof v === "string") {
      let d = new Date(v);
      if (isNaN(d.getTime())) {
        d = new Date(v + "T00:00:00.000Z");
      }
      if (!isNaN(d.getTime())) updateData.birthDate = d;
      else updateData.birthDate = null;
    }
  }

  if (updateData.parentDealerId !== undefined) {
    if (updateData.parentDealerId === "") updateData.parentDealerId = null;
  }
  if (updateData.responsibleEmployeeId !== undefined) {
    if (updateData.responsibleEmployeeId === "")
      updateData.responsibleEmployeeId = null;
  }

  if (updateData.relationshipScore !== undefined) {
    const rs = updateData.relationshipScore;
    if (rs === null || rs === "") updateData.relationshipScore = null;
    else updateData.relationshipScore = Number(rs);
    if (Number.isNaN(updateData.relationshipScore))
      updateData.relationshipScore = null;
  }

  if (updateData.shippingAddresses) {
    const addresses = updateData.shippingAddresses as any[];
    delete updateData.shippingAddresses;
    updateData.addresses = {
      deleteMany: {},
      create: addresses.map((addr) => ({
        addressLine: addr.addressLine,
        province: addr.province,
        district: addr.district,
        subdistrict: addr.subdistrict,
        postalCode: addr.postalCode ? String(addr.postalCode) : undefined,
      })),
    };
  }

  if (updateData.contacts) {
    const contacts = updateData.contacts as any[];
    delete updateData.contacts;
    updateData.contacts = {
      deleteMany: {},
      create: contacts.map((contact) => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
      })),
    };
  }

  return updateCustomer(id, updateData);
}
