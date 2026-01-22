import { getGiteeToken, saveGiteeToken } from '../helpers/gitee-token';

// Fetch Gitee API data with stored token; returns null when unauthenticated or on failure.
export const giteeRequest = async (endpoint: string, options: RequestInit = {}): Promise<any | null> => {
  const token = await getGiteeToken();
  if (!token) {
    return null;
  }

  // Attach token as a query parameter to avoid mutating caller-provided options.
  const url = `https://gitee.com/api/v5/${endpoint}?access_token=${token}`;

  try {
    const response = await fetch(url, {
      ...options,
    });
    // Let callers handle API-level errors based on response payload.
    return response.json();
  } catch (error) {
    return null;
  }
};

// Re-export token helpers for convenience.
export { saveGiteeToken, getGiteeToken };
