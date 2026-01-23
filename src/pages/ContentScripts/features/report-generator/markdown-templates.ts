/**
 * Markdown 报告模板生成函数
 */

export interface ReportData {
  quarterTitle: string;
  period: string;
  analyzeDate: string;
  trendImgBase64: string;
  activityInfo: any;
  openrankInfo: any;
  starInfo: any;
  forkInfo: any;
  contribInfo: any;
  prMergeRateCur: number;
  prMergeRateDiff: number;
  aiInsight: string;
  longInsight: string;
  nextPeriod: string;
  topContrib: Array<{ login: string; commits?: number }>;
  significantChanges: string[];
  trendWord: (p: number) => string;
  prRateTrendWord: (p: number) => string;
  pctWord: (v: number) => string;
  arrow: (v: number) => string;
  starDeltaDesc: string;
}

/**
 * 生成指标总览表格
 */
export function generateMetricsTable(data: ReportData): string {
  return `| 指标名称 | 当前值 | 环比变化 | 解读 |
|:----------|:--------:|:-----------:|:------|
| **活跃度（Activity）** | ${Math.round(data.activityInfo.cur)} | ${data.pctWord(data.activityInfo.pct)} | 开发活跃度${data.trendWord(data.activityInfo.pct)} |
| **影响力（OpenRank）** | ${Math.round(data.openrankInfo.cur * 10) / 10} | ${data.pctWord(data.openrankInfo.pct)} | 外部引用与关注度${data.trendWord(data.openrankInfo.pct)} |
| **Star 数** | ${data.starInfo.cur} | ${data.arrow(data.starInfo.pct)} ${data.starInfo.pct > 0 ? '+' : ''}${data.starInfo.pct}%（${data.starInfo.diff >= 0 ? '+' : ''}${data.starInfo.diff}） | 热度${data.starDeltaDesc} |
| **Fork 数** | ${data.forkInfo.cur} | ${data.pctWord(data.forkInfo.pct)} | 开发者二次利用率${data.trendWord(data.forkInfo.pct)} |
| **贡献者数** | ${data.contribInfo.cur} | ${data.pctWord(data.contribInfo.pct)} | 团队规模${data.trendWord(data.contribInfo.pct)} |
| **PR 合并率** | ${data.prMergeRateCur}% | ${data.pctWord(data.prMergeRateDiff)} | 协作${data.prRateTrendWord(data.prMergeRateDiff)} |`;
}

/**
 * 生成综合分析与后续建议表格
 */
export function generateAnalysisTable(): string {
  return `| 方向 | 建议 | 预期效果 |
|:------|:------|:-----------|
| **外部传播** | 通过 Release 公告、X（Twitter）、知乎技术社区等提升曝光 | 增强项目影响力，吸引新用户 |
| **贡献者扩展** | 增设 \`good-first-issue\`、完善贡献指南 | 提高新开发者参与度 |
| **社区活跃闭环** | 定期发布"月报+周报"结合AI解读 | 提升参与粘性与反馈循环 |
| **指标优化** | 结合 open-digger API 自动生成可视化分析 | 提高数据透明度与可解释性 |`;
}

/**
 * 生成下期展望内容
 */
export function generateOutlook(nextPeriod: string): string {
  return `- 🔄 继续跟踪 Star 与 OpenRank 变化，评估传播策略效果。  
- 🚀 准备 ${nextPeriod} 指标体系更新，增加"代码质量"和"响应速度"等维度。  
- 🤝 尝试引入社区参与度评分（基于 Issue 回复时长与 PR Review 数）。`;
}

/**
 * 生成完整报告Markdown
 */
export function generateReportMarkdown(data: ReportData): string {
  const metricsTable = generateMetricsTable(data);
  const analysisTable = generateAnalysisTable();
  const outlook = generateOutlook(data.nextPeriod);

  return `# 🗓️ OpenDigger 项目季度报告（${data.quarterTitle || ''}）

> 报告周期：${data.period}  
> 数据来源：OpenDigger API  
> 分析生成时间：${data.analyzeDate}  
> 报告生成方式：AI自动生成（结合开源指标与自然语言分析）

---

## 📊 一、指标总览

${metricsTable}

---

## 📈 二、可视化趋势（自动生成）

> 近6个月主要指标，数据源：OpenDigger。曲线动画/导出PDF均可保留。
![近6个月多指标趋势](${data.trendImgBase64})

---

## 🤖 三、AI 自动解读

### 📈 综合指标分析

${data.aiInsight}

### 💡 深度洞察

${data.longInsight}

---

## 💡 四、综合分析与后续建议

${analysisTable}

---

## 🧩 五、下期展望

${outlook}

---

> ✨ *报告由 AI 辅助生成，基于公开指标与上下文趋势分析，供项目团队内部参考。*
---
`;
}

