export * from "./validations";
export * from "./create-customer";
export * from "./update-customer";

import {
  findCustomers,
  findCustomerById,
  softDeleteCustomer,
  ListCustomersParams,
} from "../infrastructure/customer.repository";

export async function getCustomersUseCase(params: ListCustomersParams) {
  return findCustomers(params);
}

export async function getCustomerDetailUseCase(id: string) {
  return findCustomerById(id);
}

export async function deleteCustomerUseCase(id: string) {
  return softDeleteCustomer(id);
}
