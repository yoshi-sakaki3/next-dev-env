import Form from 'next/form';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { expiryStatus, listProducts } from '@/lib/products';
import { todayInTokyo } from '@/lib/today';

/** 商品の一覧（検索・期限が近いものの絞り込み・CSV 出力） */
export default function Page(props: PageProps<'/'>) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">商品一覧</h1>
        <Link href="/products/new" className="btn-primary">
          新規登録
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">読み込み中…</p>}>
        <ProductList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

const yen = new Intl.NumberFormat('ja-JP');

const STATUS_STYLE = {
  expired: {
    label: '期限切れ',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  },
  soon: {
    label: '30日以内',
    className: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  },
  ok: null,
  none: null,
} as const;

async function ProductList({ searchParams }: Pick<PageProps<'/'>, 'searchParams'>) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const expiring = sp.expiring === '1';
  const saved = typeof sp.saved === 'string' ? sp.saved : null;
  const today = todayInTokyo();
  const rows = await listProducts({ q, expiringWithinDays: expiring ? 30 : undefined, today });

  const exportQuery = new URLSearchParams({
    ...(q && { q }),
    ...(expiring && { expiring: '1' }),
  }).toString();

  return (
    <>
      {saved && (
        <p
          role="status"
          className="mb-4 rounded-md border-l-4 border-green-700 bg-white px-3 py-2 dark:bg-zinc-900"
        >
          「{saved}」を保存しました。
        </p>
      )}
      {sp.deleted === '1' && (
        <p
          role="status"
          className="mb-4 rounded-md border-l-4 border-green-700 bg-white px-3 py-2 dark:bg-zinc-900"
        >
          削除しました。
        </p>
      )}

      <Form action="/" className="mb-4 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 basis-60">
          <span className="mb-1 block text-sm font-semibold">
            検索（商品名・JAN コード・ロット番号）
          </span>
          <input name="q" defaultValue={q} className="field" placeholder="例：マスク" />
        </label>
        <label className="flex items-center gap-2 py-2 text-sm">
          <input
            type="checkbox"
            name="expiring"
            value="1"
            defaultChecked={expiring}
            className="size-4"
          />
          使用期限が30日以内・期限切れだけ
        </label>
        <button type="submit" className="btn-secondary">
          絞り込む
        </button>
        <a
          href={`/api/products/export${exportQuery ? `?${exportQuery}` : ''}`}
          className="btn-secondary"
          download
        >
          CSV 出力
        </a>
      </Form>

      <p className="mb-2 text-sm text-zinc-500">
        {rows.length} 件（今日：{today}。期限の近い順）
      </p>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-zinc-500 dark:border-zinc-600">
          該当する商品がありません。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-zinc-50 text-left dark:bg-zinc-800">
              <tr>
                <th className="px-3 py-2">商品名</th>
                <th className="px-3 py-2">JAN コード</th>
                <th className="px-3 py-2">区分</th>
                <th className="px-3 py-2 text-right">単価（税抜）</th>
                <th className="px-3 py-2 text-right">在庫</th>
                <th className="px-3 py-2">ロット</th>
                <th className="px-3 py-2">使用期限</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const status = STATUS_STYLE[expiryStatus(p.expiryDate, today)];
                return (
                  <tr key={p.id} className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-3 py-2">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="font-semibold text-amber-800 hover:underline dark:text-amber-300"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono">{p.janCode}</td>
                    <td className="px-3 py-2">{p.category}</td>
                    <td className="px-3 py-2 text-right">{yen.format(p.price)} 円</td>
                    <td className="px-3 py-2 text-right">
                      {yen.format(p.stock)} {p.unit}
                    </td>
                    <td className="px-3 py-2">{p.lotNumber ?? '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {p.expiryDate ?? '—'}
                      {status && (
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
