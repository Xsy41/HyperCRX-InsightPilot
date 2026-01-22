/**
 * 数据格式化工具函数
 */

/**
 * 标准化时间序列数据
 * 将对象格式或数组格式的数据统一转换为 [["YYYY-MM", number], ...] 格式
 */
export function normalizeSeries(series: any): [string, number][] {
  if (!series) return [];
  if (Array.isArray(series)) return series as [string, number][];
  if (typeof series === 'object') {
    return Object.keys(series)
      .map((k): [string, number] => {
        // 保证格式为 YYYY-MM（两位月份）
        const m = String(k).replace(
          /^([0-9]{4})-([0-9]{1,2})$/,
          (_: string, y: string, mo: string) => `${y}-${mo.padStart(2, '0')}`
        );
        return [m, Number(series[k]) || 0];
      })
      .sort(([a], [b]) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime());
  }
  return [];
}

/**
 * 获取月度条目（过滤掉非标准格式的数据）
 */
export function monthlyEntries(raw: any): [string, number][] {
  return normalizeSeries(raw).filter(([k]) => /^\d{4}-\d{2}$/.test(String(k)));
}

/**
 * 获取时间序列中的最后一个月
 */
export function lastMonthFrom(series: [string, number][]): string {
  return series && series.length ? series[series.length - 1][0] : '';
}

/**
 * 计算最近两个月的对比数据
 */
export interface LastTwoByMonthResult {
  cur: number;
  prev: number;
  diff: number;
  pct: number;
  curMonth: string;
  prevMonth: string;
}

export function lastTwoByMonth(raw: any): LastTwoByMonthResult {
  const series = monthlyEntries(raw);
  const map = new Map<string, number>();
  series.forEach((it) => {
    const k = String(it[0]);
    const v = Number(it[1]) || 0;
    map.set(k, v);
  });
  const months = Array.from(map.keys()).sort();
  const n = months.length;
  const curMonth = n > 0 ? months[n - 1] : '';
  const prevMonth = n > 1 ? months[n - 2] : '';
  const cur = curMonth ? (map.get(curMonth) ?? 0) : 0;
  const prev = prevMonth ? (map.get(prevMonth) ?? 0) : 0;
  // 避免除以零
  const pct = prev !== 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : (cur > 0 ? 100 : 0);
  return { cur, prev, diff: cur - prev, pct, curMonth, prevMonth };
}

/**
 * 格式化月份显示（如 "2025-01" -> "25/01"）
 */
export function formatMonthShort(month: string): string {
  const [y, mo] = String(month).split('-');
  const yy = (y || '').slice(-2);
  return `${yy}/${mo || ''}`;
}

