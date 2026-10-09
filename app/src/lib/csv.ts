/**
 * CSV の読み書き（Excel で開けるように、書き出しは UTF-8 の BOM つき・改行は CRLF）。
 * 見本なので外部の部品は使わず、ダブルクォートで囲んだ値（カンマ・改行・"" を含む）まで扱う。
 */

const BOM = '﻿';

function escapeCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  // 先頭が = + - @ の値は、Excel で数式として実行されないように ' を付ける（CSV インジェクション対策）
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(
  header: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  const lines = [header, ...rows].map((cols) => cols.map(escapeCell).join(','));
  return BOM + lines.join('\r\n') + '\r\n';
}

/** CSV の文字列を、行ごとの文字列の配列にする（空行は飛ばす） */
export function parseCsv(text: string): string[][] {
  const src = text.startsWith(BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}
