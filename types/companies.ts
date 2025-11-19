export interface Company {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  companyId: string;
}
