import { createProductAction } from '../actions';
import { ProductForm } from '../product-form';

export default function NewProductPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">商品の新規登録</h1>
      <ProductForm action={createProductAction} submitLabel="登録する" />
    </>
  );
}
