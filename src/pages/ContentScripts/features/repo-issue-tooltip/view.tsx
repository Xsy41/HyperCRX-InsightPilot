import React, { useState, useEffect } from 'react';

import getGithubTheme from '../../../../helpers/get-github-theme';
import { isNull, isAllNull } from '../../../../helpers/is-null';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import IssueChart from './IssueChart';
import { RepoMeta } from '../../../../api/common';
import TooltipTrigger from '../../../../components/TooltipTrigger';
import { useTranslation } from 'react-i18next';
import '../../../../helpers/i18n';
import isGithub from '../../../../helpers/is-github';
const theme = isGithub() ? getGithubTheme() : 'light';

export interface IssueDetail {
  issuesOpened: any;
  issuesClosed: any;
  issueComments: any;
}

interface Props {
  currentRepo: string;
  issueDetail: IssueDetail;
  meta: RepoMeta;
}

const generateData = (issueDetail: IssueDetail, updatedAt: number): any => {
  return {
    issuesOpened: generateDataByMonth(issueDetail.issuesOpened, updatedAt),
    issuesClosed: generateDataByMonth(issueDetail.issuesClosed, updatedAt),
    issueComments: generateDataByMonth(issueDetail.issueComments, updatedAt),
  };
};

const View = ({ currentRepo, issueDetail, meta }: Props): JSX.Element | null => {
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

  if (isNull(issueDetail) || isAllNull(issueDetail)) return null;

  const onClick = (curMonth: string, params: any) => {
    if (!isGithub()) return;
    const seriesIndex = params.seriesIndex;
    let type;
    if (seriesIndex === 0) {
      type = 'created';
    } else if (seriesIndex === 1) {
      type = 'closed';
    } else if (seriesIndex === 2) {
      type = 'updated';
    }
    let [year, month] = curMonth.toString().split(',')[0].split('-');
    if (month.length < 2) {
      month = '0' + month;
    }
    window.open(`/${currentRepo}/issues?q=is:issue ${type}:${year}-${month} sort:updated-asc`);
  };

  const generateLocalSummary = () => {
    try {
      const data = generateData(issueDetail, meta.updatedAt);
      const take = (arr: [string, number][], n: number) => arr.slice(Math.max(0, arr.length - n));
      const trend = (arr: [string, number][]) => {
        const recent = take(arr, 6).map((x) => x[1]);
        if (recent.length < 2) return { dir: 'flat', change: 0 } as any;
        const first = recent[0];
        const last = recent[recent.length - 1];
        const change = last - first;
        const pct = first === 0 ? (last > 0 ? 1 : 0) : change / first;
        const dir = pct > 0.2 ? 'up' : pct < -0.2 ? 'down' : 'flat';
        return { dir, change: Math.round(change), pct: Math.round(pct * 100), last } as any;
      };

      const o = trend(data.issuesOpened);
      const c = trend(data.issuesClosed);
      const m = trend(data.issueComments);

      const lastMonth = (() => {
        const candidates = [data.issuesOpened, data.issuesClosed, data.issueComments].filter((a) => a.length > 0);
        if (candidates.length === 0) return '';
        const last = candidates[0][candidates[0].length - 1][0];
        return last;
      })();

      const dirWord = (d: string) => (d === 'up' ? '上升' : d === 'down' ? '下降' : '基本稳定');
      const emphWord = (d: string) => (d === 'up' ? '上升显著' : d === 'down' ? '下降显著' : '基本稳定');
      const part = (name: string, t: any) =>
        `${name}${dirWord(t.dir)}（${t.change >= 0 ? '+' : ''}${t.change}${t.pct !== undefined ? `，约${t.pct}%` : ''}）`;

      const openedLast = data.issuesOpened.at(-1)?.[1] ?? 0;
      const closedLast = data.issuesClosed.at(-1)?.[1] ?? 0;
      const balance = openedLast - closedLast;

      const balanceText =
        balance > 0 ? '新增多于关闭，积压可能上升' : balance < 0 ? '关闭多于新增，积压在缓解' : '新增与关闭基本持平';

      const pairState =
        Math.abs(openedLast - closedLast) / (Math.max(openedLast, closedLast) || 1) <= 0.1
          ? '基本持平'
          : openedLast > closedLast
            ? '新增高于关闭'
            : '关闭高于新增';
      const overallState =
        o.dir === 'flat' && c.dir === 'flat'
          ? '稳定状态'
          : o.dir === 'up' && c.dir === 'up'
            ? '同步上升'
            : o.dir === 'down' && c.dir === 'down'
              ? '同步下降'
              : '阶段性波动';
      const commentTone =
        m.dir === 'down'
          ? '评论数下降显著，或意味着项目讨论减少、维护节奏趋缓。'
          : m.dir === 'up'
            ? '评论数上升显著，或意味着社区互动更活跃、需求反馈增多。'
            : '评论数基本稳定。';

      const points: string[] = [];
      if (o.dir === 'up')
        points.push(`📈 本月新增 issue ${emphWord('up')}（约${Math.abs(o.pct)}%），可能与版本更新或活动曝光相关。`);
      if (c.dir === 'down') points.push('📉 近期关闭率下降，需关注未解决问题积压。');
      if (o.dir === 'flat' && c.dir === 'flat' && m.dir === 'flat') points.push('⚖️ 整体稳定，项目维护节奏平稳。');

      const header = `系统观察到过去6个月（截至 ${lastMonth}），Issue 的创建与关闭数量${pairState}，整体处于${overallState}。${commentTone}`;
      return header;
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
        <div style={{ marginRight: '5px' }}>{t('issue_popup_title')}</div>

        <TooltipTrigger iconColor="grey" size={13} content={t('icon_tip', { icon_content: '$t(issue_icon)' })} />
      </div>

      <IssueChart
        theme={theme as 'light' | 'dark'}
        width={300}
        height={200}
        data={generateData(issueDetail, meta.updatedAt)}
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
          {aiLoading ? '生成中…' : 'AI解读 Issue 趋势'}
        </button>
      </div>

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
