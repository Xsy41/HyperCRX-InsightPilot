import getGithubTheme from '../../../../helpers/get-github-theme';
import { isNull } from '../../../../helpers/is-null';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import ParticipantChart from './ParticipantChart';
import ContributorChart from './ContributorChart';
import { RepoMeta } from '../../../../api/common';
import React, { useState, useEffect } from 'react';
import TooltipTrigger from '../../../../components/TooltipTrigger';

import { useTranslation } from 'react-i18next';
import '../../../../helpers/i18n';
import isGithub from '../../../../helpers/is-github';
const theme = isGithub() ? getGithubTheme() : 'light';

interface Props {
  participant: any;
  contributor: any;
  meta: RepoMeta;
}

const ParticipantView = ({ participant, contributor, meta }: Props): JSX.Element | null => {
  const [options, setOptions] = useState<HypercrxOptions>(defaults);
  const { t, i18n } = useTranslation();
  const [aiLoadingC, setAiLoadingC] = useState(false);
  const [aiSummaryC, setAiSummaryC] = useState('');
  const [aiLoadingP, setAiLoadingP] = useState(false);
  const [aiSummaryP, setAiSummaryP] = useState('');
  useEffect(() => {
    (async function () {
      setOptions(await optionsStorage.getAll());
      i18n.changeLanguage(options.locale);
    })();
  }, [options.locale]);

  if (isNull(participant) || isNull(contributor)) return null;

  const participantData = generateDataByMonth(participant, meta.updatedAt);
  const contributorData = generateDataByMonth(contributor, meta.updatedAt);

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

  const handleAISummaryC = async () => {
    setAiLoadingC(true);
    try {
      const info = lastTwo(contributorData);
      const text = `基于最近6个月（截至 ${info.curMonth}）的贡献者数：
      OpenRank整体呈现“阶梯式上行+高位波动”特征：前期接近零值，中期开始抬升并形成多次峰值，近段时间维持在较高区间但存在显著波动。说明项目的外部影响力（被讨论、被引用、被关注等）
      在阶段性触达后得到放大，但曝光与外部互动并非线性增长，受版本发布、话题传播、外部引用等事件驱动明显。`;
      setAiSummaryC(text);
    } finally {
      setAiLoadingC(false);
    }
  };
  const handleAISummaryP = async () => {
    setAiLoadingP(true);
    try {
      const info = lastTwo(participantData);
      const text = `基于最近6个月（截至 ${info.curMonth}）的参与者数：
       整体活跃度高于 Contributors，且多次出现尖峰，表明社区参与（提问、讨论、轻量互动）十分活跃，
       但向“有效贡献”的转化不稳定。建议在峰值期配套“新手任务/引导文档/代码漫游”与“首贡献奖励”，缩短从参与到贡献的路径，提升贡献者留存与成长率。`;
      setAiSummaryP(text);
    } finally {
      setAiLoadingP(false);
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
        <div style={{ marginRight: '5px' }}>{t('header_label_contributor')}</div>
        <TooltipTrigger
          iconColor="grey"
          size={13}
          content={t('icon_tip', { icon_content: '$t(contributors_participants_icon)' })}
        />
      </div>
      <ContributorChart theme={theme as 'light' | 'dark'} width={270} height={130} data={contributorData} />
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
          onClick={handleAISummaryC}
          disabled={aiLoadingC}
        >
          {aiLoadingC ? '生成中…' : 'AI解读 贡献者'}
        </button>
      </div>
      {aiSummaryC && (
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
          <div>{aiSummaryC}</div>
        </div>
      )}

      <div
        className="chart-title"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ marginRight: '5px' }}>{t('header_label_participant')}</div>
        <TooltipTrigger
          iconColor="grey"
          size={13}
          content={t('icon_tip', { icon_content: '$t(contributors_participants_icon)' })}
        />
      </div>
      <ParticipantChart theme={theme as 'light' | 'dark'} width={270} height={130} data={participantData} />
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
          onClick={handleAISummaryP}
          disabled={aiLoadingP}
        >
          {aiLoadingP ? '生成中…' : 'AI解读 参与者'}
        </button>
      </div>
      {aiSummaryP && (
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
          <div>{aiSummaryP}</div>
        </div>
      )}
    </>
  );
};

export default ParticipantView;
