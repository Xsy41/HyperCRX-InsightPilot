import React, { useState, useEffect } from 'react';
import getGithubTheme from '../../../../helpers/get-github-theme';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import StarChart from './StarChart';
import { RepoMeta } from '../../../../api/common';
import TooltipTrigger from '../../../../components/TooltipTrigger';
import { useTranslation } from 'react-i18next';
import '../../../../helpers/i18n';
import isGithub from '../../../../helpers/is-github';
const theme = isGithub() ? getGithubTheme() : 'light';

interface Props {
  stars: any;
  meta: RepoMeta;
}

const View = ({ stars, meta }: Props): JSX.Element | null => {
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

  if (!stars) return null;

  const handleAISummary = async () => {
    setAiLoading(true);
    try {
      const starData = generateDataByMonth(stars, meta.updatedAt);
      
      // 调用后端 API 使用模版系统生成解读
      const resp = await fetch('http://localhost:5001/api/star-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: '', // 可以从 context 获取
          data: starData,
        }),
      })
        .then((r) => {
          if (!r.ok) {
            console.error('Star AI API 错误:', r.status, r.statusText);
            return null;
          }
          return r.json();
        })
        .catch((err) => {
          console.error('Star AI API 请求失败:', err);
          return null;
        });

      const summary = resp?.summary;
      if (summary) {
        setAiSummary(summary);
      } else {
        // 如果 API 失败，显示错误信息或使用回退
        const errorMsg = resp?.error || '无法连接到后端服务，请确保后端已启动（http://localhost:5001）';
        console.error('Star AI 解读失败:', errorMsg);
        setAiSummary(`无法生成解读。\n\n[提示: ${errorMsg}]`);
      }
    } catch (error) {
      console.error('Star AI 解读异常:', error);
      setAiSummary(`无法生成解读。\n\n[错误: 请检查后端服务是否正常运行]`);
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
        <div style={{ marginRight: '5px' }}>{t('star_popup_title')}</div>
        <TooltipTrigger iconColor="grey" size={13} content={t('icon_tip', { icon_content: '$t(star_icon)' })} />
      </div>
      <StarChart
        theme={theme as 'light' | 'dark'}
        width={270}
        height={130}
        data={generateDataByMonth(stars, meta.updatedAt)}
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
          {aiLoading ? '生成中…' : 'AI解读 Star'}
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
