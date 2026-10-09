import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '商品管理（見本）',
  description: 'ロット番号・使用期限つきの商品管理の見本（Next.js + PostgreSQL）',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="border-l-4 border-amber-700 pl-2 text-lg font-bold">
              商品管理
            </Link>
            <Link href="/" className="text-sm hover:underline">
              一覧
            </Link>
            <Link href="/products/new" className="text-sm hover:underline">
              新規登録
            </Link>
            <Link href="/products/import" className="text-sm hover:underline">
              CSV 取り込み
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
