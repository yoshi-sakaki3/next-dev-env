import { describe, expect, it } from 'vitest';
import { isValidJan, janCheckDigit, makeJan } from './jan';

describe('JAN コード', () => {
  it('チェックディジットを計算できる（456995111617 → 9）', () => {
    expect(janCheckDigit('456995111617')).toBe(9);
  });

  it('正しい13桁は通し、最後の1桁が違うものは断る', () => {
    expect(isValidJan('4569951116179')).toBe(true);
    expect(isValidJan('4569951116170')).toBe(false);
  });

  it('桁数や数字以外を断る', () => {
    expect(isValidJan('456995111617')).toBe(false);
    expect(isValidJan('45699511161790')).toBe(false);
    expect(isValidJan('45699511161a9')).toBe(false);
  });

  it('makeJan で作った番号は正しい', () => {
    expect(isValidJan(makeJan('200000000001'))).toBe(true);
  });
});
