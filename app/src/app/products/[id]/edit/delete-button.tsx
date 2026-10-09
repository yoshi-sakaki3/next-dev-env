'use client';

/** 削除ボタン（押すと確認を出す） */
export function DeleteButton({ action, name }: { action: () => Promise<void>; name: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`「${name}」を削除します。元に戻せません。よろしいですか？`))
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="btn border-red-700 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        この商品を削除
      </button>
    </form>
  );
}
