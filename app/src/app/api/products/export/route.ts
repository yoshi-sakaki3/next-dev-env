import { connection, type NextRequest } from 'next/server';
import { listProducts, productsToCsv } from '@/lib/products';
import { todayInTokyo } from '@/lib/today';

/** 一覧と同じ条件で CSV を書き出す（Excel で開ける UTF-8 BOM つき） */
export async function GET(request: NextRequest) {
  await connection();
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const expiring = request.nextUrl.searchParams.get('expiring') === '1';
  const today = todayInTokyo();
  const rows = await listProducts({ q, expiringWithinDays: expiring ? 30 : undefined, today });

  const filename = `products_${today.replaceAll('-', '')}.csv`;
  return new Response(productsToCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
