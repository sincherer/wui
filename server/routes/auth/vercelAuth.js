import { Router } from 'express';
import { surgeConfig } from '../../../config.js';

const vercelAuthRouter = Router();

vercelAuthRouter.post('/', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing Vercel API token',
        code: 'MISSING_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Validate token format
    if (!/^[A-Za-z0-9_]{24}$/.test(token)) {
      return res.status(401).json({
        error: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT',
        timestamp: new Date().toISOString()
      });
    }

    // Verify token with Vercel API
    const verification = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!verification.ok) {
      return res.status(401).json({
        error: 'Invalid Vercel credentials',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    let userData;
try {
  userData = await verification.json();
} catch (e) {
  return res.status(502).json({
    error: 'Invalid response from Vercel API',
    code: 'INVALID_API_RESPONSE',
    details: 'Failed to parse authentication response',
    timestamp: new Date().toISOString()
  });
}
    
    // Validate response structure
    if (!userData?.user?.id) {
      return res.status(502).json({
        error: 'Invalid user data from Vercel API',
        code: 'INVALID_USER_DATA',
        details: 'Missing required user fields in response',
        timestamp: new Date().toISOString()
      });
    }

    res
      .status(200)
      .set('Content-Type', 'application/json')
      .json({
        success: true,
        user: {
          id: userData.user.id,
          name: userData.user.name || '',
          email: userData.user.email || ''
        },
        timestamp: new Date().toISOString()
      });

  } catch (error) {
    console.error('Vercel auth error:', error);
    // Ensure proper JSON formatting even in error cases
if (!res.headersSent) {
  res.status(500).json({
    error: 'Authentication server error',
    code: 'AUTH_SERVER_ERROR',
    details: error.message || 'Unknown error occurred',
    timestamp: new Date().toISOString()
  });
}
  }
});

export { vercelAuthRouter };