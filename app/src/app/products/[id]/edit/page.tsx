import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProduct } from '@/lib/products';
import { deleteProductAction, updateProductAction } from '../../actions';
import { ProductForm } from '../../product-form';
import { DeleteButton } from './delete-button';

export default function EditProductPage(props: PageProps<'/products/[id]/edit'>) {
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">商品の編集</h1>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <EditForm params={props.params} />
      </Suspense>
    </>
  );
}

async function EditForm({ params }: Pick<PageProps<'/products/[id]/edit'>, 'params'>) {
  const { id: idText } = await params;
  const id = Number(idText);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const p = await getProduct(id);
  if (!p) notFound();

  return (
    <>
      <ProductForm
        action={updateProductAction.bind(null, p.id)}
        submitLabel="保存する"
        initial={{
          name: p.name,
          janCode: p.janCode,
          category: p.category,
          unit: p.unit,
          price: String(p.price),
          stock: String(p.stock),
          lotNumber: p.lotNumber ?? '',
          expiryDate: p.expiryDate ?? '',
        }}
      />
      <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <DeleteButton action={deleteProductAction.bind(null, p.id)} name={p.name} />
      </div>
    </>
  );
}
