const isGitee = (): boolean => {
  return window.location.hostname === 'gitee.com';
};

export default isGitee;
