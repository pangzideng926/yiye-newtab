// 1900-2049 年农历查表数据（十六进制编码：闰月、大小月及闰月天数）
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0,
  0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0,
  0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50,
  0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0,
  0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0,
  0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260,
  0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558,
  0x0b540, 0x0b5a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
  0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5,
  0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954,
  0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3,
  0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2,
  0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
];

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_DAYS = [
  '',
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十',
];
const TIAN_GAN = '甲乙丙丁戊己庚辛壬癸';
const DI_ZHI = '子丑寅卯辰巳午未申酉戌亥';
const SHENG_XIAO = '鼠牛虎兔龙蛇马羊猴鸡狗猪';

export interface LunarDateInfo {
  year: number;
  month: number;
  day: number;
  leap: boolean;
  ganzhi: string;
  zodiac: string;
  text: string;
}

function leapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function leapDays(year: number): number {
  return leapMonth(year) ? (LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29) : 0;
}

function lunarYearDays(year: number): number {
  let sum = 348;
  const info = LUNAR_INFO[year - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += info & i ? 1 : 0;
  }
  return sum + leapDays(year);
}

function monthDays(year: number, month: number): number {
  return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29;
}

/** 公历（1900-2049）转农历 */
export function toLunar(sy: number, sm: number, sd: number): LunarDateInfo | null {
  if (sy < 1900 || sy > 2049) return null;
  if (sm < 1 || sm > 12 || sd < 1 || sd > 31) return null;

  let offset = Math.round((Date.UTC(sy, sm - 1, sd) - Date.UTC(1900, 0, 31)) / 86400000);
  if (offset < 0) return null;

  let i = 1900;
  let temp = 0;
  for (; i < 2050 && offset > 0; i += 1) {
    temp = lunarYearDays(i);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    i -= 1;
  }

  const year = i;
  const leap = leapMonth(year);
  let isLeap = false;

  for (i = 1; i < 13 && offset > 0; i += 1) {
    if (leap > 0 && i === leap + 1 && !isLeap) {
      i -= 1;
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, i);
    }
    if (isLeap && i === leap + 1) {
      isLeap = false;
    }
    offset -= temp;
  }

  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      i -= 1;
    }
  }
  if (offset < 0) {
    offset += temp;
    i -= 1;
  }

  const month = i;
  const day = offset + 1;
  const ganzhi = TIAN_GAN[(year - 4) % 10] + DI_ZHI[(year - 4) % 12];
  const zodiac = SHENG_XIAO[(year - 4) % 12];
  const monthLabel = `${isLeap ? '闰' : ''}${LUNAR_MONTHS[month - 1]}月`;
  const dayLabel = LUNAR_DAYS[day] ?? '';

  return {
    year,
    month,
    day,
    leap: isLeap,
    ganzhi,
    zodiac,
    text: `农历${ganzhi}年（${zodiac}） ${monthLabel}${dayLabel}`,
  };
}
