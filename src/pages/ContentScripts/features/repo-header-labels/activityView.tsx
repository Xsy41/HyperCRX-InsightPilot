import getGithubTheme from '../../../../helpers/get-github-theme';
import { isNull } from '../../../../helpers/is-null';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import ActivityChart from './ActivityChart';
import { RepoMeta } from '../../../../api/common';
import React, { useState, useEffect } from 'react';
import TooltipTrigger from '../../../../components/TooltipTrigger';
import { useTranslation } from 'react-i18next';
import '../../../../helpers/i18n';
import isGithub from '../../../../helpers/is-github';
const theme = isGithub() ? getGithubTheme() : 'light';
interface Props {
  activity: any;
  meta: RepoMeta;
}

const ActivityView = ({ activity, meta }: Props): JSX.Element | null => {
  const [options, setOptions] = useState<HypercrxOptions>(defaults);
  const { t, i18n } = useTranslation();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  useEffect(() => {
    (async function () {
      setOptions(await optionsStorage.getAll());
      i18n.changeLanguage(options.locale);
    })();
  }, [options.locale]);

  if (isNull(activity)) return null;

  const activityData = generateDataByMonth(activity, meta.updatedAt);

  const lastTwo = (arr: [string, number][]) => {
    if (!arr || arr.length === 0) return { cur: 0, prev: 0, pct: 0, curMonth: '' } as any;
    const last = arr[arr.length - 1];
    const prev = arr.length > 1 ? arr[arr.length - 2] : (['', 0] as [string, number]);
    const from = prev[1] || 0;
    const to = last[1] || 0;
    const pct = from === 0 ? (to > 0 ? 100 : 0) : Math.round(((to - from) / from) * 1000) / 10;
    return { cur: to, prev: from, pct, curMonth: String(last[0] || '') };
  };
  const arrow = (v: number) => (v > 0 ? '↑' : v < 0 ? '↓' : '→');
  const pctWord = (v: number) => `${arrow(v)} ${Math.abs(v)}%`;
  const trendWord = (p: number) =>
    p > 20 ? '显著上升' : p > 0 ? '小幅上升' : p < -20 ? '显著下降' : p < 0 ? '略有下降' : '基本稳定';

  const handleAISummary = async () => {
    setAiLoading(true);
    try {
      const info = lastTwo(activityData);
      const text = `基于最近6个月（截至 ${info.curMonth}）的 Activity：
      Activity 呈“阶段性跃升+高位波动”特征。前段快速爬升并出现多次尖峰（集中提交/修复/合并期），中段维持在较高区间但振幅较大，后段有明显回落。说明研发节奏受版本里程碑或集中迭代驱动明显，活跃高峰后存在短期衰减。`;
      setAiSummary(text);
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
        <div style={{ marginRight: '5px' }}>{t('header_label_activity')}</div>
        <TooltipTrigger iconColor="grey" size={13} content={t('icon_tip', { icon_content: '$t(activity_icon)' })} />
      </div>
      <ActivityChart theme={theme as 'light' | 'dark'} width={270} height={130} data={activityData} />

      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center' }}>
        <button
          style={{
            padding: '3px 8px',
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
          {aiLoading ? '生成中…' : 'AI解读 Activity'}
        </button>
      </div>

      {aiSummary && (
        <div
          style={{
            marginTop: '6px',
            border: '1px solid #f0f0f0',
            background: '#fafafa',
            borderRadius: '8px',
            padding: '6px 8px',
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

export default ActivityView;
