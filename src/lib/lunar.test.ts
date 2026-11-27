import { describe, expect, it } from 'vitest';
import { toLunar } from './lunar';

describe('农历换算 toLunar', () => {
  it('能正确换算已知春节与传统节日日期', () => {
    // 1900-01-31 为算法基准日：庚子年正月初一
    const base = toLunar(1900, 1, 31);
    expect(base).toMatchObject({ year: 1900, month: 1, day: 1, leap: false, zodiac: '鼠' });

    // 2024-02-10：甲辰龙年正月初一
    const cny2024 = toLunar(2024, 2, 10);
    expect(cny2024).toMatchObject({
      year: 2024,
      month: 1,
      day: 1,
      leap: false,
      ganzhi: '甲辰',
      zodiac: '龙',
    });
    expect(cny2024?.text).toContain('甲辰年（龙） 正月初一');

    // 2025-01-29：乙巳蛇年正月初一
    const cny2025 = toLunar(2025, 1, 29);
    expect(cny2025).toMatchObject({
      year: 2025,
      month: 1,
      day: 1,
      leap: false,
      ganzhi: '乙巳',
      zodiac: '蛇',
    });

    // 2026-02-17：丙午马年正月初一
    const cny2026 = toLunar(2026, 2, 17);
    expect(cny2026).toMatchObject({
      year: 2026,
      month: 1,
      day: 1,
      leap: false,
      ganzhi: '丙午',
      zodiac: '马',
    });
  });

  it('能正确识别闰月日期（2023 年闰二月）', () => {
    const leapDay = toLunar(2023, 3, 22);
    expect(leapDay).toMatchObject({
      year: 2023,
      month: 2,
      day: 1,
      leap: true,
      ganzhi: '癸卯',
      zodiac: '兔',
    });
    expect(leapDay?.text).toContain('闰二月初一');
  });

  it('超出支持年份范围时返回 null', () => {
    expect(toLunar(1899, 12, 31)).toBeNull();
    expect(toLunar(2050, 1, 1)).toBeNull();
  });
});
