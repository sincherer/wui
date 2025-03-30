export const surgeConfig = {
  domainFormat: (websiteId) => `${websiteId}.surge.sh`,
  maxDeployments: 3,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
  },
  cliPath: process.env.SURGE_CLI_PATH || 'surge',
  auth: {
    cookieName: 'surge_token',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  }
};