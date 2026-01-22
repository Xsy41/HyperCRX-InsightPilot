import { getGithubToken, saveGithubToken } from '../helpers/github-token';

// Fetch GitHub API data with stored token; returns null when unauthenticated or on failure.
export const githubRequest = async (endpoint: string, options: RequestInit = {}): Promise<any | null> => {
  const token = await getGithubToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      ...options,
    });
    // Let callers handle API-level errors based on response payload.
    return response.json();
  } catch (error) {
    return null;
  }
};

// Re-export token helpers for convenience.
export { saveGithubToken, getGithubToken };
