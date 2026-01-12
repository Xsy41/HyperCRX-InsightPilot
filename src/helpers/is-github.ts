const isGithub = (): boolean => {
  return window.location.hostname === 'github.com';
};

export default isGithub;
