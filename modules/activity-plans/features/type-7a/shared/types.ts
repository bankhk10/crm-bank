export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  province?: string | null;
  district?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  categoryId?: string | null;
  productGroupId?: string | null;
  price?: number | null;
  unit?: string | null;
}

export interface ProductCategoryOption {
  id: string;
  code: string;
  description: string;
  name?: string;
}

export interface ChemicalGroupOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface Type7DemoProductLine {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit?: string;
}
