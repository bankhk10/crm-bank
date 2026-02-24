import { ProductManageForm } from "@/modules/products/features/form/product-manage-form";

export default async function ProductManagementPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductManageForm productId={productId} />;
}
