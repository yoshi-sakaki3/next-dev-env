'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  fromFormData,
  productInput,
  toFieldErrors,
  type FieldErrors,
  type ProductInputRaw,
} from '@/lib/product-input';
import {
  createProduct,
  deleteProduct,
  findByJan,
  importProductsCsv,
  updateProduct,
  type ImportResult,
} from '@/lib/products';

// 注意：Server Action は画面を通さず直接呼ぶこともできる。本番ではここでログインと権限を必ず確かめる。

export type FormState = { errors: FieldErrors; values: ProductInputRaw | null; message?: string };

async function save(id: number | null, formData: FormData): Promise<FormState> {
  const values = fromFormData(formData);
  const parsed = productInput.safeParse(values);
  if (!parsed.success) return { errors: toFieldErrors(parsed.error), values };

  const sameJan = await findByJan(parsed.data.janCode);
  if (sameJan && sameJan.id !== id) {
    return { errors: { janCode: `この JAN コードは「${sameJan.name}」で登録済みです` }, values };
  }

  if (id == null) {
    await createProduct(parsed.data);
  } else if (!(await updateProduct(id, parsed.data))) {
    return { errors: {}, values, message: 'この商品は削除されています' };
  }
  redirect(`/?saved=${encodeURIComponent(parsed.data.name)}`);
}

export async function createProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return save(null, formData);
}

export async function updateProductAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return save(id, formData);
}

export async function deleteProductAction(id: number): Promise<void> {
  await deleteProduct(id);
  redirect('/?deleted=1');
}

export type ImportState = ImportResult | null;

export async function importCsvAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, errors: [{ line: 0, message: 'CSV ファイルを選んでください' }] };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, errors: [{ line: 0, message: 'ファイルは 2MB までにしてください' }] };
  }
  const text = new TextDecoder('utf-8', { fatal: false }).decode(await file.arrayBuffer());
  if (text.includes('�')) {
    return {
      ok: false,
      errors: [
        { line: 0, message: '文字コードは UTF-8 で保存してください（Excel では「CSV UTF-8」）' },
      ],
    };
  }
  const result = await importProductsCsv(text);
  if (result.ok) refresh();
  return result;
}
