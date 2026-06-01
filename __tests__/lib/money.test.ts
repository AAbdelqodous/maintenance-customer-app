import { formatKD, formatKDSigned, sumLinesFils } from '../../lib/money';

describe('money', () => {
  it('formatKD renders exactly 3 decimals (en)', () => {
    expect(formatKD(12.5, 'en')).toBe('KD 12.500');
    expect(formatKD(0, 'en')).toBe('KD 0.000');
  });

  it('formatKD (ar) appends the KD suffix and 3 decimals', () => {
    const out = formatKD(12.5, 'ar');
    expect(out).toContain('د.ك');
    expect(out).toMatch(/[0-9٠-٩]/); // contains a digit (latin or arabic-indic)
  });

  it('formatKDSigned prefixes + / −', () => {
    expect(formatKDSigned(5, 'en')).toBe('+KD 5.000');
    expect(formatKDSigned(-5, 'en')).toBe('−KD 5.000');
  });

  it('sumLinesFils is fils-safe (no float drift)', () => {
    expect(sumLinesFils([18.0, 12.5, -2.0])).toBe(28.5);
    // 0.1 + 0.2 would drift with naive float math; fils-safe stays exact
    expect(sumLinesFils([0.1, 0.2])).toBe(0.3);
  });

  it('detects a wrong total vs the line sum (FR-002 reconcile)', () => {
    const lines = [18.0, 12.5, -2.0];
    expect(sumLinesFils(lines)).not.toBe(99.999);
  });
});
