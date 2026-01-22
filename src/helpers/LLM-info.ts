// DeepSeek API 默认配置
// 注意：对于 LangChain ChatOpenAI，baseURL 应该是基础域名，LangChain 会自动添加 /v1/chat/completions
// 安全提示：API Key 不应硬编码在代码中，应通过用户配置或环境变量提供
const DEFAULT_BASE_URL = 'https://api.deepseek.com';
// 移除硬编码的 API Key，必须由用户通过 UI 配置或从环境变量获取
const DEFAULT_MODEL_NAME = 'deepseek-chat';

export const saveLLMInfo = (baseUrl: string, apiKey: string, modelName: string) => {
  localStorage.setItem('baseUrl', baseUrl);
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('modelName', modelName);
};

export const getLLMInfo = () => {
  const baseUrl = localStorage.getItem('baseUrl') || DEFAULT_BASE_URL;
  // 不再提供默认 API Key，必须由用户配置
  const apiKey = localStorage.getItem('apiKey') || '';
  const modelName = localStorage.getItem('modelName') || DEFAULT_MODEL_NAME;
  return {
    baseUrl,
    apiKey,
    modelName,
  };
};
