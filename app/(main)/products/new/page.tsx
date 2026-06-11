import { ProductNewView, getProductAction } from "@/modules/products";

export default async function NewProductPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.searchParams;
  const copyFrom = params.copyFrom as string | undefined;
  
  let initialData = undefined;
  if (copyFrom) {
    const res = await getProductAction(copyFrom);
    if (res.success && 'product' in res && res.product) {
       // Omit unique id and images to prevent exact duplication issues, but keep productCode as requested by user
       const { id, images, ...restProduct } = res.product as any;
       initialData = { ...restProduct };
    }
  }

  return <ProductNewView initialData={initialData} />;
}
