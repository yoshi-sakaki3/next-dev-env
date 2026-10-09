import { describe, expect, it } from 'vitest';
import { productInput, toFieldErrors, type ProductInputRaw } from './product-input';

const valid: ProductInputRaw = {
  name: ' 不織布マスク 50枚入 ',
  janCode: '2000000000015',
  category: '衛生用品',
  unit: '箱',
  price: '480',
  stock: '120',
  lotNumber: '',
  expiryDate: '2027-03-31',
};

describe('商品の入力チェック', () => {
  it('正しい入力を数値・null に変換する', () => {
    const r = productInput.parse(valid);
    expect(r).toMatchObject({
      name: '不織布マスク 50枚入',
      price: 480,
      stock: 120,
      lotNumber: null,
      expiryDate: '2027-03-31',
    });
  });

  it('誤りを項目ごとに返す', () => {
    const r = productInput.safeParse({
      ...valid,
      name: '',
      janCode: '2000000000010',
      price: '-1',
      expiryDate: '2027-02-30',
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    const errors = toFieldErrors(r.error);
    expect(Object.keys(errors).sort()).toEqual(['expiryDate', 'janCode', 'name', 'price']);
    expect(errors.name).toBe('商品名を入力してください');
  });

  it('一覧にない区分を断る', () => {
    expect(productInput.safeParse({ ...valid, category: '食品' }).success).toBe(false);
  });
});
