'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CATEGORIES, type FieldErrors, type ProductInputRaw } from '@/lib/product-input';
import type { FormState } from './actions';

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: ProductInputRaw;
  submitLabel: string;
};

const EMPTY: ProductInputRaw = {
  name: '',
  janCode: '',
  category: '衛生用品',
  unit: '箱',
  price: '',
  stock: '0',
  lotNumber: '',
  expiryDate: '',
};

/** 商品の登録・編集フォーム。誤りは各欄の下に出し、入力した値は消さない */
export function ProductForm({ action, initial = EMPTY, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, { errors: {}, values: null });
  const v = state.values ?? initial;
  const errors: FieldErrors = state.errors;

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      {state.message && (
        <p role="alert" className="font-semibold text-red-700 sm:col-span-2 dark:text-red-400">
          {state.message}
        </p>
      )}
      <Field label="商品名" name="name" error={errors.name} className="sm:col-span-2">
        <input
          id="name"
          name="name"
          defaultValue={v.name}
          className="field"
          maxLength={100}
          required
        />
      </Field>
      <Field label="JAN コード（13桁）" name="janCode" error={errors.janCode}>
        <input
          id="janCode"
          name="janCode"
          defaultValue={v.janCode}
          className="field font-mono"
          inputMode="numeric"
          maxLength={13}
          required
        />
      </Field>
      <Field label="区分" name="category" error={errors.category}>
        <select id="category" name="category" defaultValue={v.category} className="field">
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="単価（税抜・円）" name="price" error={errors.price}>
        <input
          id="price"
          name="price"
          defaultValue={v.price}
          className="field"
          inputMode="numeric"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="在庫数" name="stock" error={errors.stock}>
          <input
            id="stock"
            name="stock"
            defaultValue={v.stock}
            className="field"
            inputMode="numeric"
            required
          />
        </Field>
        <Field label="単位" name="unit" error={errors.unit}>
          <input
            id="unit"
            name="unit"
            defaultValue={v.unit}
            className="field"
            maxLength={10}
            required
          />
        </Field>
      </div>
      <Field label="ロット番号（任意）" name="lotNumber" error={errors.lotNumber}>
        <input
          id="lotNumber"
          name="lotNumber"
          defaultValue={v.lotNumber}
          className="field"
          maxLength={30}
        />
      </Field>
      <Field label="使用期限（任意）" name="expiryDate" error={errors.expiryDate}>
        <input
          id="expiryDate"
          name="expiryDate"
          type="date"
          defaultValue={v.expiryDate}
          className="field"
        />
      </Field>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? '保存中…' : submitLabel}
        </button>
        <Link href="/" className="btn-secondary">
          一覧に戻る
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  className = '',
  children,
}: {
  label: string;
  name: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${name}-error`}
          className="mt-1 text-sm font-semibold text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
