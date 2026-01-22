import { forEach } from 'lodash';
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import type { RunnableConfig } from '@langchain/core/runnables';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
export const handleStream = async (stream: any) => {
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        try {
          const chunkText = chunk.content;
          controller.enqueue(encoder.encode(chunkText));
        } catch (err) {
          controller.error(err);
        }
      }
      controller.close();
    },
  });
  return new Response(readableStream);
};
export const convertChunkToJson = (rawData: string) => {
  const messages: string[] = [];
  forEach(rawData, (chunk) => {
    messages.push(chunk);
  });
  // final message
  return { message: messages.join('') };
};
interface HistoricalDataItem {
  name: string;
  data: [string, number][]; // [month, value] pairs
  year2025: [string, number][];
}

export const getResponse = async (
  messages: any,
  model: any,
  aiRunnableConfig: RunnableConfig,
  memory: ChatMessageHistory,
  repoContext?: {
    repoName: string;
    description?: string;
    stars?: number;
    forks?: number;
    language?: string;
    topics?: string[];
    historicalData?: {
      stars?: HistoricalDataItem | null;
      forks?: HistoricalDataItem | null;
      activity?: HistoricalDataItem | null;
      openrank?: HistoricalDataItem | null;
      issuesOpened?: HistoricalDataItem | null;
      issuesClosed?: HistoricalDataItem | null;
      issueComments?: HistoricalDataItem | null;
      prOpened?: HistoricalDataItem | null;
      prMerged?: HistoricalDataItem | null;
      prReviews?: HistoricalDataItem | null;
      participant?: HistoricalDataItem | null;
      contributor?: HistoricalDataItem | null;
    };
  }
) => {
  // 构建包含仓库上下文的 system prompt
  let systemPrompt = 'You are an intelligent question answering robot from x-lab laboratory on the GitHub platform. Your feature is GitHub related Q&A.';
  
  if (repoContext && repoContext.repoName) {
    systemPrompt += `\n\nYou are currently helping with questions about the GitHub repository: ${repoContext.repoName}`;
    if (repoContext.description) {
      systemPrompt += `\nRepository description: ${repoContext.description}`;
    }
    if (repoContext.language) {
      systemPrompt += `\nPrimary language: ${repoContext.language}`;
    }
    if (repoContext.topics && repoContext.topics.length > 0) {
      systemPrompt += `\nTopics: ${repoContext.topics.join(', ')}`;
    }
    
    // 注意：不要使用当前实时 Stars/Forks 数据来回答历史问题
    // 这些数据可能不准确或与历史数据不一致，只使用历史数据来回答问题
    systemPrompt += '\n\nIMPORTANT: Answer style guidelines:';
    systemPrompt += '\n- Answer questions naturally and directly, as if you are familiar with this repository.';
    systemPrompt += '\n- DO NOT mention "根据提供的数据" (based on provided data), "根据提供的月度历史数据", "根据历史数据", or any similar phrases.';
    systemPrompt += '\n- DO NOT say "我对...总结如下" or "根据数据，我对...总结如下".';
    systemPrompt += '\n- Just answer naturally and directly. For example:';
    systemPrompt += '\n  ✓ Good: "2025年2月新增了3个star" or "2025年，该项目在star增长方面表现活跃，2月新增3个star"';
    systemPrompt += '\n  ✗ Bad: "根据提供的数据，2025年2月新增了3个star" or "根据提供的月度历史数据，我对项目总结如下"';
    systemPrompt += '\n- When summarizing, start directly with the content, e.g., "2025年，该项目..." or "从数据来看，2025年..." (but avoid "根据数据").';
    systemPrompt += '\n- Write as if you naturally know this information about the repository, without referencing the data source.';
    
    // 添加历史数据
    if (repoContext.historicalData) {
      systemPrompt += '\n\n=== Historical Data (Monthly Time Series) ===';
      systemPrompt += '\nYou have access to the following historical metrics. Use this data to answer questions about trends, changes, and statistics.';
      systemPrompt += '\n\nIMPORTANT: Data format explanation:';
      systemPrompt += '\n- Stars and Forks: The value represents NEW items added in that month (not cumulative). Example: "2025-02=3" means 3 new stars were added in February 2025.';
      systemPrompt += '\n- Contributors and Participants: These are cumulative values (total count up to that month).';
      systemPrompt += '\n- Issues, PRs, Comments: These are monthly counts (how many occurred in that month).';
      systemPrompt += '\n- To answer "new in Month X", directly use the value for that month for Stars/Forks/Issues/PRs.';
      systemPrompt += '\n\nCRITICAL: When answering questions about historical data:';
      systemPrompt += '\n- ONLY use the historical monthly data provided below to answer questions.';
      systemPrompt += '\n- DO NOT mention or use "current Stars" or "current Forks" counts in your answers.';
      systemPrompt += '\n- DO NOT say things like "截至 X 月，项目拥有 Y 个 Star" when answering historical questions.';
      systemPrompt += '\n- Focus on the monthly new counts and trends from the historical data.';
      
      const formatMetricData = (metric: HistoricalDataItem | null | undefined, metricName: string) => {
        if (!metric || !metric.data || metric.data.length === 0) return '';
        
        // 判断是累计指标还是月度指标
        // Stars 和 Forks 是每月新增数量（不是累计）
        // Contributors 和 Participants 是累计值
        const isCumulative = metricName === 'Contributors' || metricName === 'Participants';
        const isMonthlyNew = metricName === 'Stars' || metricName === 'Forks';
        
        let text = `\n\n${metricName}${isCumulative ? ' (cumulative)' : isMonthlyNew ? ' (monthly new count)' : ' (monthly count)'}:`;
        
        // 显示最近6个月的数据
        const recent6Months = metric.data.slice(-6);
        text += `\nRecent 6 months: ${recent6Months.map(([month, value]) => `${month}=${value}`).join(', ')}`;
        
        // 2025年的详细数据
        if (metric.year2025 && metric.year2025.length > 0) {
          if (isCumulative) {
            // 累计指标：显示累计值和增量
            text += `\n2025 monthly data (cumulative, monthly new):`;
            for (let i = 0; i < metric.year2025.length; i++) {
              const [month, value] = metric.year2025[i];
              if (i === 0) {
                text += ` ${month}=${value}(base)`;
              } else {
                const prevValue = metric.year2025[i - 1][1];
                const increment = value - prevValue;
                text += `, ${month}=${value}(+${increment})`;
              }
            }
            const first2025 = metric.year2025[0]?.[1] || 0;
            const last2025 = metric.year2025[metric.year2025.length - 1]?.[1] || 0;
            const totalNew2025 = last2025 - first2025;
            text += `\n2025 summary: Started at ${first2025}, Ended at ${last2025}, Total new in 2025: ${totalNew2025 >= 0 ? '+' : ''}${totalNew2025}`;
          } else {
            // 月度指标（包括 Stars, Forks, Issues, PRs 等）：直接显示每月新增数量
            const total2025 = metric.year2025.reduce((sum, [, value]) => sum + value, 0);
            text += `\n2025 monthly new: ${metric.year2025.map(([month, value]) => `${month}=${value}`).join(', ')}`;
            text += `\n2025 total: ${total2025} (sum of all months)`;
          }
        }
        
        // 计算总体趋势（所有数据）
        if (metric.data.length >= 2) {
          const first = metric.data[0][1];
          const last = metric.data[metric.data.length - 1][1];
          const firstMonth = metric.data[0][0];
          const lastMonth = metric.data[metric.data.length - 1][0];
          const change = last - first;
          const changePercent = first > 0 ? ((change / first) * 100).toFixed(1) : 'N/A';
          text += `\nAll-time: ${firstMonth}=${first} → ${lastMonth}=${last} (change: ${change >= 0 ? '+' : ''}${change}, ${changePercent}%)`;
        }
        
        return text;
      };
      
      // 添加各个指标的历史数据
      if (repoContext.historicalData.stars) {
        systemPrompt += formatMetricData(repoContext.historicalData.stars, 'Stars');
      }
      if (repoContext.historicalData.forks) {
        systemPrompt += formatMetricData(repoContext.historicalData.forks, 'Forks');
      }
      if (repoContext.historicalData.activity) {
        systemPrompt += formatMetricData(repoContext.historicalData.activity, 'Activity');
      }
      if (repoContext.historicalData.openrank) {
        systemPrompt += formatMetricData(repoContext.historicalData.openrank, 'OpenRank');
      }
      if (repoContext.historicalData.issuesOpened) {
        systemPrompt += formatMetricData(repoContext.historicalData.issuesOpened, 'Issues Opened');
      }
      if (repoContext.historicalData.issuesClosed) {
        systemPrompt += formatMetricData(repoContext.historicalData.issuesClosed, 'Issues Closed');
      }
      if (repoContext.historicalData.issueComments) {
        systemPrompt += formatMetricData(repoContext.historicalData.issueComments, 'Issue Comments');
      }
      if (repoContext.historicalData.prOpened) {
        systemPrompt += formatMetricData(repoContext.historicalData.prOpened, 'PR Opened');
      }
      if (repoContext.historicalData.prMerged) {
        systemPrompt += formatMetricData(repoContext.historicalData.prMerged, 'PR Merged');
      }
      if (repoContext.historicalData.prReviews) {
        systemPrompt += formatMetricData(repoContext.historicalData.prReviews, 'PR Reviews');
      }
      if (repoContext.historicalData.participant) {
        systemPrompt += formatMetricData(repoContext.historicalData.participant, 'Participants');
      }
      if (repoContext.historicalData.contributor) {
        systemPrompt += formatMetricData(repoContext.historicalData.contributor, 'Contributors');
      }
    }
    
    systemPrompt += '\n\nPlease answer questions about this repository based on the historical data and information provided above. You can calculate changes, trends, and statistics from the data. If you don\'t know something, say so honestly.';
  }
  
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      systemPrompt,
    ],
    new MessagesPlaceholder('chat_history'),
    HumanMessagePromptTemplate.fromTemplate('{input}'),
  ]);

  const chain = prompt.pipe(model);
  const chainWithMessageHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: (_sessionId) => memory,
    inputMessagesKey: 'input',
    historyMessagesKey: 'chat_history',
  });

  const responseStream = await chainWithMessageHistory.stream({ input: messages }, aiRunnableConfig);
  return handleStream(responseStream);
};
