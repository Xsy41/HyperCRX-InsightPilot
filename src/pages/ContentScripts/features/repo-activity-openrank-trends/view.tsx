import React, { useState, useEffect } from 'react';
import getGithubTheme from '../../../../helpers/get-github-theme';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import Bars from '../../../../components/Bars';
import { RepoMeta } from '../../../../api/common';
import { useTranslation } from 'react-i18next';
import '../../../../helpers/i18n';
import isGithub from '../../../../helpers/is-github';
const theme = isGithub() ? getGithubTheme() : 'light';

const generateBarsData = (activity: any, openrank: any, updatedAt: number) => {
  return {
    data1: generateDataByMonth(activity, updatedAt),
    data2: generateDataByMonth(openrank, updatedAt),
  };
};

interface Props {
  repoName: string;
  activity: any;
  openrank: any;
  meta: RepoMeta;
}

const View = ({ repoName, activity, openrank, meta }: Props): JSX.Element | null => {
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

  if (!activity || !openrank) return null;

  let barsData: any = generateBarsData(activity, openrank, meta.updatedAt);

  const onClick = (params: any) => {
    const { seriesIndex, data } = params;
    if (seriesIndex === 0) {
      let [year, month] = data.toString().split(',')[0].split('-');
      if (month.length < 2) {
        month = '0' + month;
      }

      window.open(`/${repoName}/issues?q=updated:${year}-${month} sort:updated-asc`);
    }
  };

  const generateLocalSummary = () => {
    try {
      const data = generateBarsData(activity, openrank, meta.updatedAt);
      const take = (arr: [string, number][], n: number) => arr.slice(Math.max(0, arr.length - n));
      const trend = (arr: [string, number][]) => {
        const recent = take(arr, 6).map((x) => x[1]);
        if (recent.length < 2) return { dir: 'flat', change: 0, pct: 0 } as any;
        const first = recent[0];
        const last = recent[recent.length - 1];
        const change = last - first;
        const pct = first === 0 ? (last > 0 ? 1 : 0) : change / first;
        const dir = pct > 0.2 ? 'up' : pct < -0.2 ? 'down' : 'flat';
        return { dir, change: Math.round(change), pct: Math.round(pct * 100), last } as any;
      };

      const a = trend(data.data1);
      const o = trend(data.data2);

      const lastMonth = (() => {
        const candidates = [data.data1, data.data2].filter((a) => a.length > 0);
        if (candidates.length === 0) return '';
        const last = candidates[0][candidates[0].length - 1][0];
        return last;
      })();

      const dirWord = (d: string) => (d === 'up' ? '上升' : d === 'down' ? '下降' : '基本稳定');
      const emphWord = (d: string) => (d === 'up' ? '上升显著' : d === 'down' ? '下降显著' : '基本稳定');

      const activityState = a.dir === 'flat' ? '稳定状态' : a.dir === 'up' ? '上升趋势' : '下降趋势';
      const openrankState = o.dir === 'flat' ? '稳定状态' : o.dir === 'up' ? '上升趋势' : '下降趋势';

      const points: string[] = [];
      if (a.dir === 'up') points.push(`📈 活跃度${emphWord('up')}（约${Math.abs(a.pct)}%），项目参与度提升。`);
      if (a.dir === 'down') points.push('📉 活跃度下降，需关注社区参与度。');
      if (o.dir === 'up') points.push(`🏆 OpenRank${emphWord('up')}（约${Math.abs(o.pct)}%），项目影响力提升。`);
      if (o.dir === 'down') points.push('📊 OpenRank下降，需关注项目质量和社区建设。');

      const header = `系统观察到过去6个月（截至 ${lastMonth}），项目活跃度处于${activityState}，OpenRank处于${openrankState}。`;
      return header + ' ' + points.join(' ');
    } catch (e) {
      return '无法生成解读，请稍后重试。';
    }
  };

  const handleAISummary = async () => {
    setAiLoading(true);
    try {
      const localSummary = generateLocalSummary();

      // 走本地后端（更安全：API Key 不下发到前端/插件）
      const resp = await fetch('http://localhost:5001/api/activity-trend-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: repoName,
          data: generateBarsData(activity, openrank, meta.updatedAt),
          localSummary,
        }),
      })
        .then((r) => r.json())
        .catch(() => ({}));

      const summary = resp?.summary || localSummary;
      setAiSummary(summary);
    } finally {
      setAiLoading(false);
    }
  };

  const BarsComponent = (
    <Bars
      theme={theme as 'light' | 'dark'}
      height={350}
      legend1={t('component_repoActORTrend_legend1')}
      legend2={t('component_repoActORTrend_legend2')}
      yName1={t('component_repoActORTrend_yName1')}
      yName2={t('component_repoActORTrend_yName2')}
      data1={barsData.data1}
      data2={barsData.data2}
      onClick={onClick}
    />
  );
  return isGithub() ? (
    <div>
      <h2 className="h4 mb-3">{t('component_repoActORTrend_title')}</h2>
      {BarsComponent}
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
          {aiLoading ? '生成中…' : 'AI解读 活跃度趋势'}
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
    </div>
  ) : (
    <div>
      <div className="header">{t('component_repoActORTrend_title')}</div>
      <div className="content" id="repo-activity-racing-bar">
        {BarsComponent}
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
            {aiLoading ? '生成中…' : 'AI解读 活跃度趋势'}
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
      </div>
    </div>
  );
};

export default View;
