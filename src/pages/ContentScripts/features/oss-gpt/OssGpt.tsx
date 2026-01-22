import React, { useEffect, useState, useRef } from 'react';
import { ProChat, ProChatProvider, ProChatInstance, ChatItemProps, ChatMessage } from '@ant-design/pro-chat';
import { useTheme } from 'antd-style';
import { Button, Card, Form, Input } from 'antd';
import { getRepoName, getUsername, getCurrentDeveloperName, getCurrentUserAvatar } from '../../../../helpers/get-repo-info';
import { getPlatform } from '../../../../helpers/get-platform';
import { githubRequest } from '../../../../api/githubApi';
import { 
  getStars, 
  getForks, 
  getActivity, 
  getOpenrank,
  getIssuesOpened,
  getIssuesClosed,
  getIssueComments,
  getPROpened,
  getPRMerged,
  getPRReviews,
  getParticipant,
  getContributor
} from '../../../../api/repo';
import generateDataByMonth from '../../../../helpers/generate-data-by-month';
import { getResponse, convertChunkToJson } from './service';
import StarterList from './StarterList';
import ChatItemRender from './ChatItemRender';
import UserContent from './UserContent';
import LoadingStart from './LoadingStart';
import Markdown from './components/Markdown';
import type { FormProps } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { saveLLMInfo, getLLMInfo } from '../../../../helpers/LLM-info';
import { ChatOpenAI } from '@langchain/openai';
import optionsStorage, { HypercrxOptions, defaults } from '../../../../options-storage';
import { useTranslation } from 'react-i18next';
import type { RunnableConfig } from '@langchain/core/runnables';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import '../../../../helpers/i18n';
interface FieldType {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}
interface Props {
  githubTheme: 'light' | 'dark';
}
const Chat: React.FC<Props> = ({ githubTheme }) => {
  const [options, setOptions] = useState<HypercrxOptions>(defaults);
  const { t, i18n } = useTranslation();
  const proChatRef = useRef<ProChatInstance>();
  const [complete, setComplete] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [llmInstance, setLLMInstance] = useState<any>(null);
  const [modelConfig, setModelConfig] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{ login: string; avatar_url: string } | null>(null);
  const [currentRepo, setCurrentRepo] = useState<string>('');
  const [repoContext, setRepoContext] = useState<any>(null);
  const theme = useTheme();
  const avatar = 'https://avatars.githubusercontent.com/u/57651122?s=200&v=4';
  
  // 获取当前登录用户信息和仓库信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      // 优先从 GitHub API 获取用户信息
      const userData = await githubRequest('/user');
      if (userData && userData.login) {
        setCurrentUser({
          login: userData.login,
          avatar_url: userData.avatar_url || `https://github.com/${userData.login}.png`,
        });
      } else {
        // 如果没有 token，从页面 DOM 获取用户信息
        const devName = getCurrentDeveloperName();
        const avatarFromPage = getCurrentUserAvatar();
        
        if (devName || avatarFromPage) {
          setCurrentUser({
            login: devName || '',
            avatar_url: avatarFromPage || (devName ? `https://github.com/${devName}.png` : ''),
          });
        }
      }
    };
    fetchCurrentUser();
    
    // 获取当前仓库名和详细信息（包括历史数据）
    const fetchRepoInfo = async () => {
      const repoName = getRepoName();
      const platform = getPlatform();
      setCurrentRepo(repoName);
      
      if (repoName) {
        try {
          // 获取基础仓库信息
          const repoData = await githubRequest(`/repos/${repoName}`);
          
          // 获取历史数据（时间序列）
          const [
            starsData,
            forksData,
            activityData,
            openrankData,
            issuesOpenedData,
            issuesClosedData,
            issueCommentsData,
            prOpenedData,
            prMergedData,
            prReviewsData,
            participantData,
            contributorData,
          ] = await Promise.all([
            getStars(platform, repoName).catch(() => null),
            getForks(platform, repoName).catch(() => null),
            getActivity(platform, repoName).catch(() => null),
            getOpenrank(platform, repoName).catch(() => null),
            getIssuesOpened(platform, repoName).catch(() => null),
            getIssuesClosed(platform, repoName).catch(() => null),
            getIssueComments(platform, repoName).catch(() => null),
            getPROpened(platform, repoName).catch(() => null),
            getPRMerged(platform, repoName).catch(() => null),
            getPRReviews(platform, repoName).catch(() => null),
            getParticipant(platform, repoName).catch(() => null),
            getContributor(platform, repoName).catch(() => null),
          ]);
          
          // 格式化历史数据为按月份的时间序列
          const formatTimeSeriesData = (data: any, metricName: string) => {
            if (!data) return null;
            const monthlyData = generateDataByMonth(data, Date.now());
            // 只保留最近24个月的数据，避免 prompt 过长
            const recentData = monthlyData.slice(-24);
            return {
              name: metricName,
              data: recentData,
              // 计算2025年的数据（如果存在）
              year2025: recentData.filter(([month]) => month.startsWith('2025')),
            };
          };
          
          const historicalData = {
            stars: formatTimeSeriesData(starsData, 'Stars'),
            forks: formatTimeSeriesData(forksData, 'Forks'),
            activity: formatTimeSeriesData(activityData, 'Activity'),
            openrank: formatTimeSeriesData(openrankData, 'OpenRank'),
            issuesOpened: formatTimeSeriesData(issuesOpenedData, 'Issues Opened'),
            issuesClosed: formatTimeSeriesData(issuesClosedData, 'Issues Closed'),
            issueComments: formatTimeSeriesData(issueCommentsData, 'Issue Comments'),
            prOpened: formatTimeSeriesData(prOpenedData, 'PR Opened'),
            prMerged: formatTimeSeriesData(prMergedData, 'PR Merged'),
            prReviews: formatTimeSeriesData(prReviewsData, 'PR Reviews'),
            participant: formatTimeSeriesData(participantData, 'Participants'),
            contributor: formatTimeSeriesData(contributorData, 'Contributors'),
          };
          
          setRepoContext({
            repoName: repoName,
            description: repoData?.description || '',
            stars: repoData?.stargazers_count || 0,
            forks: repoData?.forks_count || 0,
            language: repoData?.language || '',
            topics: repoData?.topics || [],
            historicalData: historicalData,
          });
        } catch (error) {
          console.error('Failed to fetch repo info:', error);
          // 如果获取失败，至少设置仓库名
          setRepoContext({ repoName: repoName });
        }
      }
    };
    fetchRepoInfo();
  }, []);
  
  // 计算用户头像，优先使用获取到的头像，否则使用默认格式
  const userAvatar = React.useMemo(() => {
    if (currentUser?.avatar_url) {
      return currentUser.avatar_url;
    }
    if (currentUser?.login) {
      return `https://github.com/${currentUser.login}.png`;
    }
    // 如果还没有获取到用户信息，尝试从页面获取
    const avatarFromPage = getCurrentUserAvatar();
    if (avatarFromPage) {
      return avatarFromPage;
    }
    // 最后回退到仓库 owner（不理想，但至少有个头像）
    const username = getUsername();
    return username ? `https://github.com/${username}.png` : '';
  }, [currentUser]);
  
  const title = '';
  const helloMessage = t('oss_gpt_hello_message');
  const starters = [t('oss_gpt_starters_introduce')];
  const sessionId = uuidv4();

  let memory = new ChatMessageHistory();
  const botInfo = {
    assistantMeta: {
      avatar: avatar,
      title: title,
    },
    helloMessage: helloMessage,
    starters: starters,
  };

  const testLLMInstance = async (config: any) => {
    const { baseUrl, apiKey, modelName } = config;
    // LangChain ChatOpenAI 会自动添加 /v1/chat/completions，所以 baseURL 应该是基础域名
    // 如果用户输入了 /v1 或 /chat/completions，需要移除
    let formattedBaseUrl = baseUrl.trim();
    if (formattedBaseUrl.includes('/v1')) {
      formattedBaseUrl = formattedBaseUrl.split('/v1')[0];
    }
    if (formattedBaseUrl.includes('/chat/completions')) {
      formattedBaseUrl = formattedBaseUrl.split('/chat/completions')[0];
    }
    formattedBaseUrl = formattedBaseUrl.replace(/\/$/, ''); // 移除末尾的斜杠
    
    const testLLM = new ChatOpenAI({
      apiKey,
      configuration: { baseURL: formattedBaseUrl },
      model: modelName,
      temperature: 0.7,
      maxRetries: 2,
      timeout: 10000, // 10秒超时
    });
    try {
      const response = await testLLM.invoke([{ role: 'user', content: 'Hello' }]);
      // 检查响应是否有效
      if (response && response.content) {
        return response;
      }
      return null;
    } catch (error: any) {
      console.error('LLM test error:', error);
      return null;
    }
  };
  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    saveLLMInfo(values.baseUrl, values.apiKey, values.modelName);
    createLLMInstance(values);
    const testResponse = await testLLMInstance(values);
    if (testResponse == null) {
      setChats([
        ...chats,
        {
          content: t('oss_gpt_llm_info_error'),
          id: uuidv4(),
          role: 'assistant',
          avatar: avatar,
          title: '',
          updateAt: Date.now(),
          createAt: Date.now(),
        },
      ]);
    } else {
      setChats([]);
    }
  };
  const UserForm = (props: { name: string; gender: string; model: string }) => {
    // 获取当前配置，优先使用 modelConfig，否则使用默认值
    const currentConfig = modelConfig || getLLMInfo();
    return (
      <Card style={{ width: '400px', height: 'auto' }}>
        <Form
          onFinish={onFinish}
          initialValues={{
            baseUrl: currentConfig.baseUrl,
            apiKey: currentConfig.apiKey,
            modelName: currentConfig.modelName,
          }}
        >
          <Form.Item
            label={t('oss_gpt_model_name')}
            name={'modelName'}
            rules={[{ required: true, message: t('oss_gpt_model_name_rule_message') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('oss_gpt_base_url')}
            name={'baseUrl'}
            rules={[{ required: true, message: t('oss_gpt_base_url_rule_message') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('oss_gpt_api_key')}
            name={'apiKey'}
            rules={[{ required: true, message: t('oss_gpt_api_key_rule_message') }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item style={{ textAlign: 'center', marginBottom: '0' }}>
            <Button type="primary" htmlType="submit">
              {t('oss_gpt_llm_info_btn')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };
  const createLLMInstance = (config: any) => {
    const { baseUrl, apiKey, modelName } = config;
    // LangChain ChatOpenAI 会自动添加 /v1/chat/completions，所以 baseURL 应该是基础域名
    // 如果用户输入了 /v1 或 /chat/completions，需要移除
    let formattedBaseUrl = baseUrl.trim();
    if (formattedBaseUrl.includes('/v1')) {
      formattedBaseUrl = formattedBaseUrl.split('/v1')[0];
    }
    if (formattedBaseUrl.includes('/chat/completions')) {
      formattedBaseUrl = formattedBaseUrl.split('/chat/completions')[0];
    }
    formattedBaseUrl = formattedBaseUrl.replace(/\/$/, ''); // 移除末尾的斜杠
    
    const model = new ChatOpenAI({
      apiKey,
      configuration: { baseURL: formattedBaseUrl },
      model: modelName,
      temperature: 0.95,
      maxRetries: 3,
    });
    setLLMInstance(model);
    setModelConfig(config);
  };

  useEffect(() => {
    const info = getLLMInfo();
    if (info.baseUrl && info.apiKey && info.modelName) {
      createLLMInstance(info);
    }
  }, []);

  useEffect(() => {
    (async function () {
      setOptions(await optionsStorage.getAll());
      i18n.changeLanguage(options.locale);
    })();
  }, [options.locale]);

  return (
    <div style={{ background: theme.colorBgLayout, width: 540, height: 550 }}>
      <ProChat
        locale={i18n.language == 'en' ? 'en-US' : 'zh-CN'}
        chatRef={proChatRef}
        userMeta={{ avatar: userAvatar }}
        assistantMeta={{ avatar: avatar }}
        chats={chats}
        onChatsChange={(chat: ChatMessage[]) => {
          if (chat.length == 0) {
            memory = new ChatMessageHistory();
          }
        }}
        request={async (messages) => {
          if (!llmInstance) {
            setChats([
              {
                content: JSON.stringify({}),
                id: uuidv4(),
                role: 'user-form',
                avatar: avatar,
                title: '',
                updateAt: Date.now(),
                createAt: Date.now(),
              },
            ]);
            return;
          }
          try {
            const aiRunnableConfig: RunnableConfig = {
              configurable: {
                sessionId: sessionId,
              },
            };
            return await getResponse(
              messages.at(-1)?.content?.toString(),
              llmInstance,
              aiRunnableConfig,
              memory,
              repoContext
            );
          } catch (error: any) {
            return error.message;
          }
        }}
        actions={{
          render: (defaultDoms) => {
            return [
              <a
                key="user"
                onClick={() => {
                  setChats([
                    {
                      content: JSON.stringify({}),
                      id: uuidv4(),
                      role: 'user-form',
                      avatar: avatar,
                      title: '',
                      updateAt: Date.now(),
                      createAt: Date.now(),
                    },
                  ]);
                }}
              >
                {t('oss_gpt_llm_switch')}
              </a>,
              ...defaultDoms,
            ];
          },
          flexConfig: {
            gap: 24,
            direction: 'horizontal',
            justify: 'space-between',
          },
        }}
        chatItemRenderConfig={{
          render: (
            props: ChatItemProps,
            domsMap: {
              avatar: React.ReactNode;
              title: React.ReactNode;
              messageContent: React.ReactNode;
              actions: React.ReactNode;
              itemDom: React.ReactNode;
            },
            defaultDom: React.ReactNode
          ): React.ReactNode => {
            const originData = props.originData || {};
            const isDefault = originData.role === 'hello';
            if (isDefault) {
              return (
                <ChatItemRender
                  direction={'start'}
                  title={title}
                  avatar={domsMap.avatar}
                  content={
                    <div className="leftMessageContent">
                      <div
                        className="ant-pro-chat-list-item-message-content"
                        style={{ background: githubTheme === 'light' ? '#ffffff' : '#2e2e2e' }}
                      >
                        <div className="text-left text-[20px] font-[500] leading-[28px] font-sf">
                          {botInfo.helloMessage}
                        </div>
                      </div>
                    </div>
                  }
                  starter={
                    <StarterList
                      starters={botInfo?.starters ?? starters ?? []}
                      onClick={(msg: string) => {
                        proChatRef?.current?.sendMessage(msg);
                      }}
                      className="ml-[72px]"
                    />
                  }
                />
              );
            }
            if (originData?.role === 'user-form') {
              return (
                <ChatItemRender
                  direction={'start'}
                  avatar={domsMap.avatar}
                  title={title}
                  content={
                    <div className="leftMessageContent">
                      <UserForm {...JSON.parse(originData?.content)} />
                    </div>
                  }
                />
              );
            }
            if (originData?.role === 'user') {
              try {
                const content = JSON.parse(originData.content) as string[];
                const { text } = content.reduce(
                  (acc, item) => {
                    acc.text += text;
                    return acc;
                  },
                  { text: '' }
                );
                return <ChatItemRender direction={'end'} title={domsMap.title} content={<UserContent text={text} />} />;
              } catch (err) {
                return defaultDom;
              }
            }
            const originMessage = convertChunkToJson(originData.content) as any;
            // Default message content
            const defaultMessageContent = <div className="leftMessageContent">{defaultDom}</div>;
            // If originMessage is invalid, return default message content
            if ((!originMessage || typeof originMessage === 'string') && !!proChatRef?.current?.getChatLoadingId()) {
              return (
                <ChatItemRender
                  direction={'start'}
                  avatar={domsMap.avatar}
                  title={title}
                  content={defaultMessageContent}
                />
              );
            }
            const { message: answerStr } = originMessage;
            // Handle chat loading state
            if (!!proChatRef?.current?.getChatLoadingId() && answerStr === '...') {
              return (
                <ChatItemRender
                  direction={'start'}
                  avatar={domsMap.avatar}
                  title={title}
                  content={
                    <div className="leftMessageContent">
                      <LoadingStart loop={!complete} onComplete={() => setComplete(true)} />
                    </div>
                  }
                />
              );
            }
            return (
              <ChatItemRender
                direction={'start'}
                avatar={domsMap.avatar}
                title={title}
                content={
                  <div className="leftMessageContent">
                    <Markdown
                      className="ant-pro-chat-list-item-message-content"
                      style={{
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        background: githubTheme === 'light' ? '#ffffff' : '#2e2e2e',
                      }}
                    >
                      {answerStr}
                    </Markdown>
                  </div>
                }
              />
            );
          },
        }}
      />
    </div>
  );
};
const OssGpt: React.FC<Props> = ({ githubTheme }) => (
  <ProChatProvider>
    <Chat githubTheme={githubTheme} />
  </ProChatProvider>
);
export default OssGpt;
