import { and, asc, eq, ilike, isNotNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, type Product } from '@/db/schema';
import { parseCsv, toCsv } from './csv';
import {
  PRODUCT_FIELDS,
  productInput,
  type ProductInput,
  type ProductInputRaw,
} from './product-input';

export type ProductFilter = {
  /** 商品名・JAN コード・ロット番号の部分一致 */
  q?: string;
  /** 使用期限が今日からこの日数以内（期限切れも含む）のものだけ */
  expiringWithinDays?: number;
  /** 今日の日付（YYYY-MM-DD）。テストで固定できるように外から渡す */
  today: string;
};

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function listProducts(filter: ProductFilter): Promise<Product[]> {
  const conditions = [];
  const q = filter.q?.trim();
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(
        ilike(products.name, like),
        ilike(products.janCode, like),
        ilike(products.lotNumber, like),
      ),
    );
  }
  if (filter.expiringWithinDays != null) {
    conditions.push(
      isNotNull(products.expiryDate),
      lte(products.expiryDate, addDays(filter.today, filter.expiringWithinDays)),
    );
  }
  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(sql`${products.expiryDate} ASC NULLS LAST`, asc(products.id))
    .limit(500);
}

export async function getProduct(id: number): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.id, id));
  return row;
}

export async function findByJan(janCode: string): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.janCode, janCode));
  return row;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const [row] = await db.insert(products).values(input).returning();
  return row!;
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product | undefined> {
  const [row] = await db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return row;
}

export async function deleteProduct(id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

/** 使用期限の状態（画面の色分け用） */
export function expiryStatus(
  expiryDate: string | null,
  today: string,
): 'expired' | 'soon' | 'ok' | 'none' {
  if (!expiryDate) return 'none';
  if (expiryDate < today) return 'expired';
  if (expiryDate <= addDays(today, 30)) return 'soon';
  return 'ok';
}

// ---- CSV ----

export const CSV_HEADER = [
  '商品名',
  'JANコード',
  '区分',
  '単位',
  '単価',
  '在庫数',
  'ロット番号',
  '使用期限',
] as const;

export function productsToCsv(rows: Product[]): string {
  return toCsv(
    CSV_HEADER,
    rows.map((p) => [
      p.name,
      p.janCode,
      p.category,
      p.unit,
      p.price,
      p.stock,
      p.lotNumber,
      p.expiryDate,
    ]),
  );
}

export type ImportResult =
  | { ok: true; created: number; updated: number }
  | { ok: false; errors: { line: number; message: string }[] };

/**
 * CSV を取り込む。JAN コードが同じ商品は上書き、無ければ追加。
 * 1行でも誤りがあれば、何も保存せずに誤りの一覧を返す（途中まで入ってしまうのを防ぐ）。
 */
export async function importProductsCsv(text: string): Promise<ImportResult> {
  const rows = parseCsv(text);
  const header = rows.shift();
  if (!header || header.map((h) => h.trim()).join(',') !== CSV_HEADER.join(',')) {
    return {
      ok: false,
      errors: [{ line: 1, message: `1行目の見出しは「${CSV_HEADER.join(',')}」にしてください` }],
    };
  }
  if (rows.length === 0)
    return { ok: false, errors: [{ line: 2, message: 'データの行がありません' }] };
  if (rows.length > 5000)
    return { ok: false, errors: [{ line: 0, message: '一度に取り込めるのは 5,000 行までです' }] };

  const errors: { line: number; message: string }[] = [];
  const inputs: ProductInput[] = [];
  const seen = new Map<string, number>();

  rows.forEach((cols, i) => {
    const line = i + 2;
    // 書き出し時に Excel の数式対策で付けた ' を外す
    const cells = cols.map((c) => c.replace(/^'(?=[=+\-@\t\r])/, ''));
    const raw = Object.fromEntries(
      PRODUCT_FIELDS.map((k, j) => [k, cells[j] ?? '']),
    ) as ProductInputRaw;
    const parsed = productInput.safeParse(raw);
    if (!parsed.success) {
      errors.push({ line, message: parsed.error.issues.map((e) => e.message).join('／') });
      return;
    }
    const dup = seen.get(parsed.data.janCode);
    if (dup) {
      errors.push({
        line,
        message: `JAN コード ${parsed.data.janCode} が ${dup} 行目と重複しています`,
      });
      return;
    }
    seen.set(parsed.data.janCode, line);
    inputs.push(parsed.data);
  });

  if (errors.length > 0) return { ok: false, errors: errors.slice(0, 50) };

  let created = 0;
  await db.transaction(async (tx) => {
    for (const input of inputs) {
      const [r] = await tx
        .insert(products)
        .values(input)
        .onConflictDoUpdate({ target: products.janCode, set: { ...input, updatedAt: new Date() } })
        // xmax = 0 なら新しく追加された行（PostgreSQL の仕組み）
        .returning({ inserted: sql<boolean>`(xmax = 0)` });
      if (r?.inserted) created++;
    }
  });
  return { ok: true, created, updated: inputs.length - created };
}
