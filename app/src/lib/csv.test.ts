import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('CSV', () => {
  it('Excel 用に BOM と CRLF を付け、カンマ・改行・" を含む値を囲む', () => {
    const csv = toCsv(
      ['名前', 'メモ'],
      [
        ['A,B', '1行目\n2行目'],
        ['"引用"', null],
      ],
    );
    expect(csv).toBe('﻿名前,メモ\r\n"A,B","1行目\n2行目"\r\n"""引用""",\r\n');
  });

  it("数式として実行されそうな値の先頭に ' を付ける（CSV インジェクション対策）", () => {
    expect(toCsv(['x'], [['=1+1'], ['-5'], ['@SUM(A1)']])).toBe(
      "﻿x\r\n'=1+1\r\n'-5\r\n'@SUM(A1)\r\n",
    );
  });

  it('書き出したものを読み戻すと元に戻る', () => {
    const rows = [
      ['商品名', 'JAN'],
      ['マスク, 50枚', '2000000000015'],
      ['改行\nあり', ''],
    ];
    expect(parseCsv(toCsv(rows[0]!, rows.slice(1)))).toEqual(rows);
  });

  it('LF だけの改行と空行も読める', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});
