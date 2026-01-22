// DeepSeek API 默认配置
// 注意：对于 LangChain ChatOpenAI，baseURL 应该是基础域名，LangChain 会自动添加 /v1/chat/completions
const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_API_KEY = 'sk-13268bc72ac34d64a2195ca5156e9576';
const DEFAULT_MODEL_NAME = 'deepseek-chat';

export const saveLLMInfo = (baseUrl: string, apiKey: string, modelName: string) => {
  localStorage.setItem('baseUrl', baseUrl);
  localStorage.setItem('apiKey', apiKey);
  localStorage.setItem('modelName', modelName);
};

export const getLLMInfo = () => {
  const baseUrl = localStorage.getItem('baseUrl') || DEFAULT_BASE_URL;
  const apiKey = localStorage.getItem('apiKey') || DEFAULT_API_KEY;
  const modelName = localStorage.getItem('modelName') || DEFAULT_MODEL_NAME;
  return {
    baseUrl,
    apiKey,
    modelName,
  };
};
