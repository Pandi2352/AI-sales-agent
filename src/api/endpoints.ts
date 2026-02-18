export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
  },
  BATTLECARD: {
    GENERATE: '/battlecard/generate',
    STATUS: (jobId: string) => `/battlecard/status/${jobId}`,
    RESULT: (jobId: string) => `/battlecard/result/${jobId}`,
    STAGE_RESULT: (jobId: string, stageName: string) =>
      `/battlecard/stage-result/${jobId}/${stageName}`,
    LIST: '/battlecard/list',
    DISCOVER: '/battlecard/discover-competitors',
  },
} as const;
