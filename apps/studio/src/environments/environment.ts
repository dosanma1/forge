// Local development environment
// Uses proxy to avoid CORS - requests to /api are forwarded to localhost:8080

export const environment = {
  app: 'forge-studio',
  name: 'LOCAL',
  production: false,
  url: '/api',
  logLevel: 'debug',
  loggers: [
    {
      enabled: true,
      name: 'console',
    },
  ],
};
