import { Router } from 'express';
import { execSync } from 'child_process';
import { surgeConfig } from '../../../config.js';

export const surgeAuthRouter = Router();

surgeAuthRouter.post('/:websiteId', async (req, res) => {
  const { websiteId } = req.params;
  try {
    const { email, password } = req.body;
    
    // Validate credentials format
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Invalid credentials',
        details: 'Both email and password are required' 
      });
    }

    // Attempt authentication with Surge CLI
    // Execute surge login with credentials
let token, user;
try {
    // Verify Surge CLI installation
    try {
      execSync('surge --version');
    } catch (error) {
      return res.status(500).json({
        error: 'Surge CLI not installed',
        details: 'Install with: npm install -g surge',
        code: 'SURGE_CLI_MISSING',
        solution: 'Ensure Node.js/npm are in PATH and try reinstalling',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            path: process.env.PATH,
            nodeVersion: process.version
          }
        })
      });
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().replace(/[^\w@.-]/g, '');
    const sanitizedPassword = password.replace(/[^\x20-\x7E]/g, '');

    // Execute login with proper error handling
    console.log('Executing Surge login command with env:', {
      SURGE_LOGIN: sanitizedEmail,
      PATH: process.env.PATH,
      NODE_ENV: process.env.NODE_ENV,
      cwd: process.cwd()
    });

    // Log current working directory and PATH for debugging
    console.log('Current working directory:', process.cwd());
    console.log('PATH environment:', process.env.PATH);
    
    // Verify Surge CLI is accessible
    try {
      const surgePath = execSync('where surge', { stdio: 'pipe' }).toString().trim();
      console.log('Surge CLI found at:', surgePath);
    } catch (cliError) {
      console.error('Surge CLI not found in PATH');
      throw new Error('Surge CLI not found in system PATH');
    }

    // Verify network connectivity first
    try {
      execSync('curl -Is https://surge.systems/healthcheck --connect-timeout 5');
    } catch (networkError) {
      throw new Error('Network connectivity issue - Cannot reach Surge servers');
    }

    try {
      // First check if we can get user info
      try {
        const whoami = execSync('surge whoami', { stdio: 'pipe', timeout: 5000 }).toString();
        if (whoami.includes(sanitizedEmail)) {
          // User is already logged in, get their token and return success
          token = execSync('surge token', {
            env: { ...process.env, SURGE_LOGIN: sanitizedEmail },
            stdio: 'pipe',
            timeout: 5000
          }).toString().trim();
          user = whoami.trim();
          // Store token securely
          res.cookie('surge_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });
          return res.status(200)
            .set('Content-Type', 'application/json')
            .json({ 
              success: true,
              message: 'Already authenticated with Surge',
              user: user,
              timestamp: new Date().toISOString()
            });
        }
      } catch (e) {
        // Not logged in or timeout, continue with login attempt
        console.log('Not currently logged in, attempting login...');
      }

      // Use spawn for interactive login
      const { spawnSync } = require('child_process');
      const loginProcess = spawnSync('surge', ['login', '--email', sanitizedEmail, '--password', sanitizedPassword], {
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 15000,
        maxBuffer: 1024 * 1024 * 10,
        env: { ...process.env, SURGE_TOKEN: '', SURGE_LOGIN: sanitizedEmail },
        windowsHide: true
      });

      if (loginProcess.error) {
        console.error('Surge login process error:', {
          error: loginProcess.error.message,
          code: loginProcess.error.code,
          signal: loginProcess.error.signal
        });
        throw new Error(`Login process error: ${loginProcess.error.message}`);
      }

      if (loginProcess.signal) {
        throw new Error(`Login process terminated by signal: ${loginProcess.signal}`);
      }

      if (loginProcess.status === null) {
        throw new Error('Login process failed to start');
      }

      if (loginProcess.error) {
        throw new Error(`Login process error: ${loginProcess.error.message}`);
      }

      const output = loginProcess.stdout?.toString() || '';
      const errorOutput = loginProcess.stderr?.toString() || '';

      if (loginProcess.status !== 0) {
        const errorDetails = errorOutput || output;
        console.error('Surge login validation failed:', {
          status: loginProcess.status,
          output: output,
          errorOutput: errorOutput
        });

        // Check for specific error conditions and return proper error responses
        let errorMessage;
        if (errorOutput.toLowerCase().includes('domain is already taken')) {
          errorMessage = 'Domain is already taken';
        } else if (errorOutput.toLowerCase().includes('invalid') || errorOutput.toLowerCase().includes('unauthorized')) {
          errorMessage = 'Invalid credentials';
        } else if (errorOutput.toLowerCase().includes('network')) {
          errorMessage = 'Network error - please check your connection';
        } else {
          errorMessage = `Authentication failed: ${errorDetails}`;
        }

        return res.status(401)
          .set('Content-Type', 'application/json')
          .json({
            error: errorMessage,
            details: errorDetails,
            code: 'SURGE_AUTH_FAILED',
            timestamp: new Date().toISOString()
          });
      }



      // Verify login was successful
      const whoami = execSync('surge whoami', { stdio: 'pipe' }).toString();
      if (!whoami.includes(sanitizedEmail)) {
        throw new Error('Login verification failed');
      }
    } catch (loginError) {
      console.error('Surge login error:', {
        error: loginError.message,
        stdout: loginError.stdout?.toString(),
        stderr: loginError.stderr?.toString()
      });
      
      const errorOutput = loginError.stderr?.toString() || loginError.stdout?.toString() || loginError.message;
      const errorMessage = errorOutput.toLowerCase().includes('invalid') || errorOutput.toLowerCase().includes('unauthorized')
        ? 'Invalid credentials'
        : errorOutput.toLowerCase().includes('network')
          ? 'Network error - please check your connection'
          : 'Authentication failed';

      // Attempt account creation if login fails
      try {
        console.log('Attempting automatic account creation for:', sanitizedEmail);
        const tokenOutput = execSync(`surge token --email ${sanitizedEmail} --password '${sanitizedPassword}'`, {
          stdio: 'pipe',
          timeout: 10000,
          env: { ...process.env, SURGE_LOGIN: sanitizedEmail }
        }).toString();
        const surgeToken = tokenOutput.match(/Token: (\w+)/)?.[1];
        
        if (!surgeToken) {
          return res.status(500)
            .set('Content-Type', 'application/json')
            .json({
              error: 'Token extraction failed',
              details: 'Could not extract token from Surge response',
              code: 'TOKEN_EXTRACTION_ERROR',
              timestamp: new Date().toISOString()
            });
        }

        // Store token securely
        res.cookie('surge_token', surgeToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.status(201)
          .set('Content-Type', 'application/json')
          .json({
            success: true,
            status: 'SURGE_ACCOUNT_CREATED',
            token: surgeToken,
            email: sanitizedEmail,
            timestamp: new Date().toISOString()
          });
      } catch (creationError) {
        console.error('Account creation failed:', creationError);
        const errorDetails = creationError.stderr?.toString() || creationError.stdout?.toString() || creationError.message;
        return res.status(500)
          .set('Content-Type', 'application/json')
          .json({
            error: 'Automatic account creation failed',
            code: 'SURGE_CREATION_FAILED',
            details: creationError.message.replace(/surge/gi, 'Surge'),
            solution: 'Please check your credentials and try again',
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV === 'development' && { 
              debug: {
                stdout: creationError.stdout?.toString(),
                stderr: creationError.stderr?.toString()
              }
            })
          });
      }
    }

    // Get authentication token
    try {
      token = execSync('surge token', {
        env: { ...process.env, SURGE_LOGIN: sanitizedEmail },
        stdio: 'pipe',
        timeout: 10000
      }).toString().trim();
      
      if (!token || token.toLowerCase().includes('error')) {
        return res.status(401)
          .set('Content-Type', 'application/json')
          .json({
            error: 'Token retrieval failed',
            details: 'Invalid credentials',
            code: 'TOKEN_RETRIEVAL_ERROR',
            timestamp: new Date().toISOString()
          });
      }

      user = execSync('surge whoami', {
        env: { ...process.env, SURGE_LOGIN: sanitizedEmail },
        stdio: 'pipe',
        timeout: 10000
      }).toString().trim();

      if (!user || user.includes('not logged')) {
        return res.status(401)
          .set('Content-Type', 'application/json')
          .json({
            error: 'User verification failed',
            details: 'Please login again',
            code: 'USER_VERIFICATION_ERROR',
            timestamp: new Date().toISOString()
          });
      }
    } catch (tokenError) {
      console.error('Token retrieval error:', {
        error: tokenError.message,
        code: tokenError.code,
        signal: tokenError.signal
      });
      return res.status(502).json({
        error: 'Authentication failed',
        code: 'TOKEN_RETRIEVAL_ERROR',
        details: tokenError.message.replace(/surge/gi, 'Surge')
      });
    }
  } catch (cliError) {
    // Check if Surge CLI is installed and accessible
    try {
      execSync('which surge || where surge');
    } catch (cliCheckError) {
      console.error('Surge CLI not found in PATH:', process.env.PATH);
      throw new Error('Surge CLI not found. Please install it with: npm install -g surge');
    }

    console.error('Surge CLI execution error:', {
      error: cliError,
      message: cliError.message,
      stack: cliError.stack,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: process.env.NODE_ENV
      }
    });

const errorMessage = cliError.message.toLowerCase().includes('invalid') || cliError.message.toLowerCase().includes('unauthorized')
  ? 'Invalid Surge email/password'
  : cliError.message.toLowerCase().includes('network')
    ? 'Network error - please check your connection'
    : 'Surge CLI execution error';

console.error('Full Surge CLI error context:', {
  command: `surge login --email "${sanitizedEmail}" --password ***`,
  exitCode: cliError.status,
  stdout: cliError.stdout?.toString(),
  stderr: cliError.stderr?.toString(),
  env: process.env
});

return res.status(401).json({
  error: errorMessage,
  details: cliError.stderr?.toString() || cliError.stdout?.toString() || cliError.message,
  code: 'SURGE_AUTH_FAILED',
  debug: {
    command: 'surge login',
    exitCode: cliError.status,
    stdout: cliError.stdout?.toString(),
    stderr: cliError.stderr?.toString()
  }
});
}

    

    // Store token securely
    res.cookie('surge_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200)
      .set('Content-Type', 'application/json')
      .json({
        success: true,
        message: 'Authenticated with Surge',
        user: user,
        token: token,
        timestamp: new Date().toISOString()
      });

  } catch (error) {
    console.error('Surge auth endpoint error:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    const statusCode = error.statusCode || (error.code === 'TOKEN_FAILURE' ? 502 : 500);
    res.status(statusCode).json({
      error: error.error || 'Authentication failed',
      details: error.details || error.message,
      code: error.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        debug: error.debug
      })
    });
  }
});