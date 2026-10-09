import { z } from 'zod';
import { isValidJan } from './jan';

export const CATEGORIES = ['衛生用品', '介護用品', '検査用品', '事務用品', 'その他'] as const;

const intText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label}は0以上の整数で入力してください`)
    .transform(Number)
    .refine((n) => n <= max, `${label}は${max.toLocaleString('ja-JP')}以下で入力してください`);

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((s) => (s === '' ? null : s));

function isRealDate(s: string): boolean {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

/** 画面のフォームと CSV の1行に共通の入力チェック。値はすべて文字列で受け取る */
export const productInput = z.object({
  name: z.string().trim().min(1, '商品名を入力してください').max(100, '商品名は100文字以内です'),
  janCode: z
    .string()
    .trim()
    .refine(isValidJan, 'JAN コードが正しくありません（13桁・最後の1桁が合っているか確認）'),
  category: z.enum(CATEGORIES, { error: '区分を一覧から選んでください' }),
  unit: z.string().trim().min(1, '単位を入力してください').max(10, '単位は10文字以内です'),
  price: intText('単価', 10_000_000),
  stock: intText('在庫数', 1_000_000),
  lotNumber: optionalText(30, 'ロット番号は30文字以内です'),
  expiryDate: z
    .string()
    .trim()
    .refine(
      (s) => s === '' || (/^\d{4}-\d{2}-\d{2}$/.test(s) && isRealDate(s)),
      '使用期限は 2027-03-31 の形で入力してください',
    )
    .transform((s) => (s === '' ? null : s)),
});

export type ProductInput = z.output<typeof productInput>;

export const PRODUCT_FIELDS = [
  'name',
  'janCode',
  'category',
  'unit',
  'price',
  'stock',
  'lotNumber',
  'expiryDate',
] as const satisfies readonly (keyof ProductInput)[];

export type ProductField = (typeof PRODUCT_FIELDS)[number];
/** 画面や CSV から受け取る、チェック前の値（すべて文字列） */
export type ProductInputRaw = Record<ProductField, string>;
export type FieldErrors = Partial<Record<ProductField, string>>;

/** エラーを「項目ごとに最初の1つ」にまとめる（画面の各欄の下に出す用） */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as ProductField;
    result[key] ??= issue.message;
  }
  return result;
}

/** FormData から入力チェック用の文字列を取り出す */
export function fromFormData(form: FormData): ProductInputRaw {
  const get = (k: string) => String(form.get(k) ?? '');
  return Object.fromEntries(PRODUCT_FIELDS.map((k) => [k, get(k)])) as ProductInputRaw;
}
