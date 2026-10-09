'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { importCsvAction } from '../actions';

export function ImportForm() {
  const [result, formAction, pending] = useActionState(importCsvAction, null);

  return (
    <>
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input type="file" name="file" accept=".csv,text/csv" className="field max-w-md" required />
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? '取り込み中…' : '取り込む'}
        </button>
      </form>

      {result?.ok === true && (
        <p
          role="status"
          className="mt-6 rounded-md border-l-4 border-green-700 bg-white px-3 py-2 dark:bg-zinc-900"
        >
          取り込みました（追加 {result.created} 件・上書き {result.updated} 件）。
          <Link href="/" className="ml-2 underline">
            一覧を見る
          </Link>
        </p>
      )}
      {result?.ok === false && (
        <div
          role="alert"
          className="mt-6 rounded-md border-l-4 border-red-700 bg-white px-3 py-2 dark:bg-zinc-900"
        >
          <p className="font-semibold text-red-700 dark:text-red-400">
            取り込めませんでした。次の行を直してください（何も保存していません）。
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {result.errors.map((e, i) => (
              <li key={i}>
                {e.line > 0 && `${e.line} 行目：`}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
