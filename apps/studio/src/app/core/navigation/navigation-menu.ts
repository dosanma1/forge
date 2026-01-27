export enum Path {
  SIGN_IN = 'sign-in',
  SIGN_UP = 'sign-up',
  PASSWORD_RESET = 'password-reset',
  PROJECT = 'project',
  PROJECTS = 'projects',
  JOIN = 'join',
  DASHBOARD = 'dashboard',
  SETTINGS = 'settings',
  ACCOUNTS = 'accounts',
  PROFILE = 'profile',
  PREFERENCES = 'preferences',
  NOTIFICATIONS = 'notifications',
  GENERAL = 'general',
  DOCUMENTATION = 'documentation',
}

export enum MenuRoute {
  SIGN_IN = `/${Path.SIGN_IN}`,
  SIGN_UP = `/${Path.SIGN_UP}`,
  PASSWORD_RESET = `/${Path.PASSWORD_RESET}`,
  PROJECTS = `/${Path.PROJECTS}`,
  JOIN = `/${Path.PROJECTS}/${Path.JOIN}`,
  DASHBOARD = `/${Path.DASHBOARD}`,
  SETTINGS = `/${Path.SETTINGS}`,
  DOCUMENTATION = `/${Path.DOCUMENTATION}`,
}
