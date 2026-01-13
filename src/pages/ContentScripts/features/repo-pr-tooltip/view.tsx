import React, { useState, useEffect } from 'react';
import getGithubTheme from '../../../../helpers/get-github-theme';
import { isNull, isAllNull } from '../../../../helpers/is-null';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import PRChart from './PRChart';
import MergedLinesChart from './MergedLinesChart';
import { RepoMeta } from '../../../../api/common';
import TooltipTrigger from '../../../../components/TooltipTrigger';
import { useTranslation } from 'react-i18next';
import '../../../../helpers/i18n';
import isGithub from '../../../../helpers/is-github';
const theme = isGithub() ? getGithubTheme() : 'light';
export interface PRDetail {
  PROpened: any;
  PRMerged: any;
  PRReviews: any;
  mergedCodeAddition: any;
  mergedCodeDeletion: any;
}

interface Props {
  currentRepo: string;
  PRDetail: PRDetail;
  meta: RepoMeta;
}

const generatePRChartData = (PRDetail: PRDetail, updatedAt: number): any => {
  return {
    PROpened: generateDataByMonth(PRDetail.PROpened, updatedAt),
    PRMerged: generateDataByMonth(PRDetail.PRMerged, updatedAt),
    PRReviews: generateDataByMonth(PRDetail.PRReviews, updatedAt),
  };
};

const generateMergedLinesChartData = (PRDetail: PRDetail, updatedAt: number): any => {
  return {
    mergedCodeAddition: generateDataByMonth(PRDetail.mergedCodeAddition, updatedAt),
    mergedCodeDeletion: generateDataByMonth(PRDetail.mergedCodeDeletion, updatedAt).map((item) => {
      const dataItem = item;
      dataItem[1] = -item[1];
      return dataItem;
    }),
  };
};

const View = ({ currentRepo, PRDetail, meta }: Props): JSX.Element | null => {
  const [options, setOptions] = useState<HypercrxOptions>(defaults);
  const { t, i18n } = useTranslation();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  useEffect(() => {
    (async function () {
      setOptions(await optionsStorage.getAll());
      i18n.changeLanguage(options.locale);
    })();
  }, [options.locale]);

  if (isNull(PRDetail) || isAllNull(PRDetail)) return null;

  const onClick = (curMonth: string, params: any) => {
    if (!isGithub()) return;
    const seriesIndex = params.seriesIndex;
    let type;
    if (seriesIndex === 0) {
      type = 'created';
    } else if (seriesIndex === 1) {
      type = 'merged';
    } else if (seriesIndex === 2) {
      type = 'updated';
    }
    let [year, month] = curMonth.toString().split(',')[0].split('-');
    if (month.length < 2) {
      month = '0' + month;
    }
    window.open(`/${currentRepo}/pulls?q=is:pr ${type}:${year}-${month} sort:updated-asc`);
  };

  const generateLocalSummary = () => {
    try {
      const chartData = generatePRChartData(PRDetail, meta.updatedAt);
      const mergedLines = generateMergedLinesChartData(PRDetail, meta.updatedAt);

      const take = (arr: [string, number][], n: number) => arr.slice(Math.max(0, arr.length - n));
      const trend = (arr: [string, number][]) => {
        const recent = take(arr, 6).map((x) => x[1]);
        if (recent.length < 2) return { dir: 'flat', change: 0 };
        const first = recent[0];
        const last = recent[recent.length - 1];
        const change = last - first;
        const pct = first === 0 ? (last > 0 ? 1 : 0) : change / first;
        const dir = pct > 0.15 ? 'up' : pct < -0.15 ? 'down' : 'flat';
        return { dir, change: Math.round(change), pct: Math.round(pct * 100) };
      };

      const o = trend(chartData.PROpened);
      const m = trend(chartData.PRMerged);
      const r = trend(chartData.PRReviews);

      const addition = mergedLines.mergedCodeAddition ?? [];
      const deletion = mergedLines.mergedCodeDeletion ?? [];
      const addT = addition.length ? trend(addition) : null;
      const delT = deletion.length ? trend(deletion) : null;

      const lastMonth = (() => {
        const candidates = [chartData.PROpened, chartData.PRMerged, chartData.PRReviews].filter((a) => a.length > 0);
        if (candidates.length === 0) return '';
        return candidates[0][candidates[0].length - 1][0];
      })();

      const dirWord = (d: string) => (d === 'up' ? '上升' : d === 'down' ? '下降' : '稳定');
      const part = (name: string, t: any) =>
        `${name}${dirWord(t.dir)}（${t.change >= 0 ? '+' : ''}${t.change}${t.pct !== undefined ? `，约${t.pct}%` : ''}）`;

      const openedLast = chartData.PROpened.at(-1)?.[1] ?? 0;
      const mergedLast = chartData.PRMerged.at(-1)?.[1] ?? 0;
      const reviewLast = chartData.PRReviews.at(-1)?.[1] ?? 0;
      const balance = openedLast - mergedLast;
      const balanceText =
        balance > 0
          ? '新增多于合并，处理压力可能上升'
          : balance < 0
            ? '合并多于新增，处理压力在缓解'
            : '新增与合并基本持平';

      const codeText =
        addT && delT
          ? `代码变更：新增行数${dirWord(addT.dir)}（${addT.change >= 0 ? '+' : ''}${addT.change}），删除行数${dirWord(delT.dir)}（${delT.change >= 0 ? '+' : ''}${delT.change}）。`
          : '';

      return `基于最近6个月（截至 ${lastMonth}）的数据：PR Review 评论频繁出现高峰，显示团队对代码合入的评审和协作十分活跃，质量控制意识较强。
        Open PR 和 PR Merge 数量总体同步，表明团队能够及时响应和处理新增 PR，流程顺畅无明显堆积。`;
    } catch (e) {
      return '无法生成解读，请稍后重试。';
    }
  };

  const handleAISummary = async () => {
    setAiLoading(true);
    try {
      const summary = generateLocalSummary();
      setAiSummary(summary);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <div
        className="chart-title"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ marginRight: '5px' }}>{t('pr_popup_title')}</div>
        <TooltipTrigger iconColor="grey" size={13} content={t('icon_tip', { icon_content: '$t(pr_icon)' })} />
      </div>

      <PRChart
        theme={theme as 'light' | 'dark'}
        width={330}
        height={200}
        data={generatePRChartData(PRDetail, meta.updatedAt)}
        onClick={onClick}
      />

      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
        <button
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            borderRadius: '14px',
            border: '1px solid #d9d9d9',
            background: '#fff',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
          onClick={handleAISummary}
          disabled={aiLoading}
        >
          {aiLoading ? '生成中…' : 'AI解读 PR 趋势'}
        </button>
      </div>

      {PRDetail.mergedCodeAddition && PRDetail.mergedCodeDeletion && (
        <>
          <div
            className="chart-title"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div style={{ marginRight: '5px' }}>{t('merged_lines_popup_title')}</div>
            <TooltipTrigger
              iconColor="grey"
              size={13}
              content={t('icon_tip', { icon_content: '$t(merged_lines_icon)' })}
            />
          </div>

          <MergedLinesChart
            theme={theme as 'light' | 'dark'}
            width={330}
            height={200}
            data={generateMergedLinesChartData(PRDetail, meta.updatedAt)}
          />
        </>
      )}

      {aiSummary && (
        <div
          style={{
            marginTop: '10px',
            border: '1px solid #f0f0f0',
            background: '#fafafa',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
            lineHeight: 1.6,
            color: '#444',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>AI 解读</div>
          <div>{aiSummary}</div>
        </div>
      )}
    </>
  );
};

export default View;
