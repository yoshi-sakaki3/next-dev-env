import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-10 text-center">
      <h1 className="mb-2 text-xl font-bold">ページが見つかりません</h1>
      <p className="mb-6 text-zinc-500">商品が削除されたか、URL が間違っている可能性があります。</p>
      <Link href="/" className="btn-secondary">
        一覧に戻る
      </Link>
    </div>
  );
}
