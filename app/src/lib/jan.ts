/**
 * JAN コード（商品のバーコード番号。13桁）のチェックディジット（最後の1桁）を計算する。
 * 先頭12桁を、右から奇数番目は3倍・偶数番目は1倍して合計し、10 から1の位を引いた数（10 のときは 0）。
 */
export function janCheckDigit(first12: string): number {
  if (!/^\d{12}$/.test(first12)) throw new Error('先頭12桁の数字を渡してください');
  const sum = [...first12]
    .reverse()
    .reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}

/** 13桁の数字で、最後の1桁が正しいか */
export function isValidJan(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  return janCheckDigit(code.slice(0, 12)) === Number(code[12]);
}

/** 先頭12桁から、正しい13桁の JAN コードを作る（見本データ用） */
export function makeJan(first12: string): string {
  return first12 + janCheckDigit(first12);
}
