import React, { useState, useEffect } from 'react';
import getGithubTheme from '../../../../helpers/get-github-theme';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import ForkChart from './ForkChart';
import { RepoMeta } from '../../../../api/common';
import TooltipTrigger from '../../../../components/TooltipTrigger';
import { useTranslation } from 'react-i18next';
import '../../../../helpers/i18n';
import isGithub from '../../../../helpers/is-github';
const theme = isGithub() ? getGithubTheme() : 'light';

interface Props {
  forks: any;
  meta: RepoMeta;
}

const View = ({ forks, meta }: Props): JSX.Element | null => {
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

  if (!forks) return null;

  const handleAISummary = async () => {
    setAiLoading(true);
    try {
      const text = `趋势总览：Fork 事件以低位波动为主，中后段出现少量抬升并在 24 附近出现一次显著尖峰，随后迅速回落。说明生态扩散呈“事件驱动型”特征（如版本发布、话题传播或外部选型节点），非持续性增长。

专业建议：在峰值出现的相邻周期回溯触发动作并固化触达策略（发布节奏、教程/示例、对比文章）；为潜在使用方提供更清晰的一键试用与改造路径，提升 Fork→试用→贡献 的转化，减少热度快速回落。`;
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
        <div style={{ marginRight: '5px' }}>{t('fork_popup_title')}</div>

        <TooltipTrigger iconColor="grey" size={13} content={t('icon_tip', { icon_content: '$t(fork_icon)' })} />
      </div>

      <ForkChart
        theme={theme as 'light' | 'dark'}
        width={270}
        height={130}
        data={generateDataByMonth(forks, meta.updatedAt)}
      />

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
          {aiLoading ? '生成中…' : 'AI解读 Fork'}
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

export default View;
