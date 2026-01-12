import { getGiteeToken, saveGiteeToken, removeGiteeToken } from '../helpers/gitee-token';

export const giteeRequest = async (endpoint: string, options: RequestInit = {}): Promise<any | null> => {
  const token = await getGiteeToken();
  if (!token) {
    return null;
  }

  const url = `https://gitee.com/api/v5/${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      ...options,
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    return null;
  }
};

export { saveGiteeToken, getGiteeToken, removeGiteeToken };
