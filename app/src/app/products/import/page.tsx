import { CSV_HEADER } from '@/lib/products';
import { ImportForm } from './import-form';

export default function ImportPage() {
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">CSV 取り込み</h1>
      <div className="mb-6 space-y-2 text-sm">
        <p>
          1行目の見出しは{' '}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">{CSV_HEADER.join(',')}</code>{' '}
          にしてください。 一覧の「CSV 出力」で書き出したファイルを、そのまま直して取り込めます。
        </p>
        <p>
          JAN
          コードが同じ商品は上書きし、無ければ追加します。1行でも誤りがあれば、何も保存せずに誤りの行を表示します。
        </p>
        <p>文字コードは UTF-8 にしてください（Excel では「CSV UTF-8（コンマ区切り）」で保存）。</p>
      </div>
      <ImportForm />
    </>
  );
}
