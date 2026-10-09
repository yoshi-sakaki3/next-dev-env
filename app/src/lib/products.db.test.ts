import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db, pool } from '@/db/client';
import { products } from '@/db/schema';
import {
  CSV_HEADER,
  createProduct,
  expiryStatus,
  importProductsCsv,
  listProducts,
  productsToCsv,
} from './products';
import { productInput } from './product-input';

// テスト用 DB（app_test）を使う。vitest.config.ts で DATABASE_URL を差し替えている

const base = {
  name: 'ニトリル手袋 M 100枚入',
  janCode: '2000000000022',
  category: '衛生用品',
  unit: '箱',
  price: '980',
  stock: '45',
  lotNumber: 'GL-1',
  expiryDate: '2026-10-20',
};

beforeEach(async () => {
  await db.delete(products);
});

afterAll(async () => {
  await pool.end();
});

describe('商品の DB 操作', () => {
  it('検索と、期限の近いものの絞り込み', async () => {
    await createProduct(productInput.parse(base));
    await createProduct(
      productInput.parse({
        ...base,
        name: '不織布マスク',
        janCode: '2000000000015',
        lotNumber: '',
        expiryDate: '',
      }),
    );

    expect((await listProducts({ q: '手袋', today: '2026-10-09' })).map((p) => p.name)).toEqual([
      'ニトリル手袋 M 100枚入',
    ]);
    expect(await listProducts({ q: '2000000000015', today: '2026-10-09' })).toHaveLength(1);
    expect(
      (await listProducts({ expiringWithinDays: 30, today: '2026-10-09' })).map((p) => p.janCode),
    ).toEqual(['2000000000022']);
    expect(await listProducts({ expiringWithinDays: 5, today: '2026-10-09' })).toHaveLength(0);
  });

  it('検索語の % や _ は文字としてあつかう', async () => {
    await createProduct(productInput.parse(base));
    expect(await listProducts({ q: '%', today: '2026-10-09' })).toHaveLength(0);
  });

  it('CSV：同じ JAN は上書き、新しい JAN は追加', async () => {
    await createProduct(productInput.parse(base));
    const csv = [
      CSV_HEADER.join(','),
      'ニトリル手袋 M 100枚入,2000000000022,衛生用品,箱,1000,50,GL-2,2027-01-31',
      '不織布マスク 50枚入,2000000000015,衛生用品,箱,480,120,,',
    ].join('\n');

    expect(await importProductsCsv(csv)).toEqual({ ok: true, created: 1, updated: 1 });
    const all = await listProducts({ today: '2026-10-09' });
    expect(all).toHaveLength(2);
    expect(all.find((p) => p.janCode === '2000000000022')).toMatchObject({
      price: 1000,
      lotNumber: 'GL-2',
    });
  });

  it('CSV：1行でも誤りがあれば何も保存しない', async () => {
    const csv = [
      CSV_HEADER.join(','),
      '不織布マスク 50枚入,2000000000015,衛生用品,箱,480,120,,',
      'まちがい,2000000000010,衛生用品,箱,abc,1,,',
    ].join('\n');

    const result = await importProductsCsv(csv);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.line).toBe(3);
    expect(await listProducts({ today: '2026-10-09' })).toHaveLength(0);
  });

  it('CSV：書き出したファイルをそのまま取り込める', async () => {
    await createProduct(productInput.parse({ ...base, lotNumber: '-A1' }));
    const exported = productsToCsv(await listProducts({ today: '2026-10-09' }));
    await db.delete(products);

    expect(await importProductsCsv(exported)).toEqual({ ok: true, created: 1, updated: 0 });
    expect((await listProducts({ today: '2026-10-09' }))[0]).toMatchObject({
      lotNumber: '-A1',
      expiryDate: '2026-10-20',
    });
  });

  it('使用期限の状態', () => {
    expect(expiryStatus('2026-10-08', '2026-10-09')).toBe('expired');
    expect(expiryStatus('2026-11-08', '2026-10-09')).toBe('soon');
    expect(expiryStatus('2026-11-09', '2026-10-09')).toBe('ok');
    expect(expiryStatus(null, '2026-10-09')).toBe('none');
  });
});
