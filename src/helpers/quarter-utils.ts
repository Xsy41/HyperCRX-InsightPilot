/**
 * 季度计算工具函数
 */

export interface QuarterInfo {
  year: number;
  quarter: number;
  startMonth: number;
  endMonth: number;
}

/**
 * 获取指定月份所属的季度
 */
export function getQuarterFromMonth(year: number, month: number): number {
  return Math.ceil(month / 3);
}

/**
 * 获取指定季度的所有月份
 */
export function getQuarterMonths(year: number, quarter: number): string[] {
  const startMonth = (quarter - 1) * 3 + 1;
  return [
    `${year}-${String(startMonth).padStart(2, '0')}`,
    `${year}-${String(startMonth + 1).padStart(2, '0')}`,
    `${year}-${String(startMonth + 2).padStart(2, '0')}`,
  ];
}

/**
 * 获取上一个季度信息
 */
export function getPreviousQuarter(): QuarterInfo {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQ = Math.ceil(currentMonth / 3);
  
  let prevQ = currentQ - 1;
  let prevY = currentYear;
  if (prevQ < 1) {
    prevQ = 4;
    prevY = currentYear - 1;
  }
  
  return {
    year: prevY,
    quarter: prevQ,
    startMonth: (prevQ - 1) * 3 + 1,
    endMonth: prevQ * 3,
  };
}

/**
 * 获取下一个季度信息（基于上一个季度）
 */
export function getNextQuarter(): QuarterInfo {
  const prev = getPreviousQuarter();
  let nextQ = prev.quarter + 1;
  let nextY = prev.year;
  if (nextQ > 4) {
    nextQ = 1;
    nextY = prev.year + 1;
  }
  
  return {
    year: nextY,
    quarter: nextQ,
    startMonth: (nextQ - 1) * 3 + 1,
    endMonth: nextQ * 3,
  };
}

/**
 * 获取季度标题（如 "2025Q4"）
 */
export function getQuarterTitle(year: number, quarter: number): string {
  return `${year}Q${quarter}`;
}

/**
 * 获取季度周期字符串（如 "2025-10-01 ～ 2025-12-31"）
 */
export function getQuarterPeriod(year: number, quarter: number): string {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const startMonthStr = String(startMonth).padStart(2, '0');
  const endMonthStr = String(endMonth).padStart(2, '0');
  const startDay = '01';
  const endDay = String(daysInMonth(year, endMonth)).padStart(2, '0');
  return `${year}-${startMonthStr}-${startDay} ～ ${year}-${endMonthStr}-${endDay}`;
}

