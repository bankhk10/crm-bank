export interface Type10SoldProductItem {
  id?: string;
  isCustomProduct?: boolean;
  isCustom?: boolean;
  productId?: string | null;
  productName: string;
  productCode?: string | null;
  quantity?: string | number;
  actualQty?: string | number;
  actualSales?: string | number;
  unitPrice?: number;
  remarks?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}
