import express from 'express';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const router = express.Router();

// Enable CORS for the deployment endpoint
router.use(cors());

// Improved error handling middleware
router.use((err, req, res, next) => {
  console.error('Surge deployment error:', {
    message: err.message,
    stack: err.stack,
    body: req.body
  });

  if (!res.headersSent) {
    res
      .status(500)
      .set('Content-Type', 'application/json')
      .json({
        error: 'Internal server error',
        details: err.message,
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        errorType: err.constructor.name || 'Error'
      });
  }
});

router.post('/surge', async (req, res) => {
  // Log incoming request
  console.log('Received surge deployment request:', {
    websiteId: req.body.websiteId,
    domain: req.body.config?.domain,
    numPages: req.body.pages ? Object.keys(req.body.pages).length : 0
  });

  try {
    const { websiteId, pages, config } = req.body;
    
    // Validate required parameters
    if (!websiteId || !pages || !config?.domain) {
      return res.status(400).set('Content-Type', 'application/json').json({
        error: 'Missing required deployment parameters',
        code: 'MISSING_PARAMETERS',
        timestamp: new Date().toISOString(),
        errorType: 'ValidationError'
      });
    }

    // Create temporary directory structure
    const primaryDeployDir = path.join(process.cwd(), 'deployments', `${websiteId}_${Date.now()}`);
    const deploymentsBaseDir = path.join(process.cwd(), 'deployments');

    // Ensure deployments directory exists
    try {
      if (!fs.existsSync(deploymentsBaseDir)) {
        fs.mkdirSync(deploymentsBaseDir, { recursive: true, mode: 0o755 });
        console.log('Created deployments directory with permissions 0755');
      }
      
      // Verify base directory permissions
      const testFile = path.join(deploymentsBaseDir, 'perm-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (permError) {
      console.error('Deployments directory write failure:', {
        path: deploymentsBaseDir,
        error: permError.message,
        code: permError.code
      });
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'DEPLOY_DIR_PERMISSION',
        details: 'Cannot write to deployments directory',
        timestamp: new Date().toISOString(),
        errorType: 'ConfigurationError'
      });
    }

    // Create deployment directory
    try {
      fs.mkdirSync(primaryDeployDir, { recursive: true });
      console.log('Created deployment directory:', primaryDeployDir);
    } catch (dirError) {
      console.error('Deployment directory creation failed:', {
        error: dirError.message,
        code: dirError.code
      });
      throw new Error(`Failed to create deployment directory: ${dirError.message}`);
    }

    // Add cleanup hook for unexpected exits
    process.on('exit', () => {
      if (fs.existsSync(primaryDeployDir)) {
        console.log('Cleaning up orphaned deployment directory:', primaryDeployDir);
        fs.rmSync(primaryDeployDir, { recursive: true, force: true });
      }
    });

    // Verify surge CLI installation
    try {
      execSync('surge --version');
    } catch (error) {
      return res.status(500).set('Content-Type', 'application/json').json({
        error: 'Surge CLI not installed',
        details: 'Install with: npm install -g surge',
        code: 'SURGE_CLI_MISSING',
        timestamp: new Date().toISOString(),
        errorType: 'ConfigurationError'
      });
    }

    // Validate domain format
    if (!config.domain.match(/^[a-z0-9-]+\.surge\.sh$/i)) {
      return res.status(400).json({
        error: 'Invalid domain format',
        details: 'Domain must be in format: your-site.surge.sh',
        code: 'INVALID_DOMAIN_FORMAT',
        timestamp: new Date().toISOString(),
        errorType: 'ValidationError'
      });
    }

    // Check domain availability
    try {
      const domains = execSync('surge list', { timeout: 10000 }).toString();
      if (domains.includes(config.domain)) {
        return res.status(409).json({
          error: 'Domain already taken',
          details: 'Please choose a different subdomain',
          code: 'DOMAIN_UNAVAILABLE',
          timestamp: new Date().toISOString(),
          errorType: 'ConflictError'
        });
      }
    } catch (domainError) {
      console.error('Domain check failed:', domainError);
      return res.status(500).json({
        error: 'Domain validation failed',
        details: 'Could not verify domain availability',
        code: 'DOMAIN_CHECK_FAILED',
        timestamp: new Date().toISOString(),
        errorType: 'ValidationError'
      });
    }

    // Verify directory write permissions
    try {
      const testFile = path.join(primaryDeployDir, 'permission-test.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (permError) {
      console.error('Directory write permission error:', {
        path: primaryDeployDir,
        error: permError.message,
        code: permError.code
      });
      throw new Error(`Insufficient permissions in deployment directory: ${permError.message}`);
    }
      
    // Write pages to filesystem
    // Sanitize filenames and validate websiteId
    if (!/^[a-z0-9-]+$/i.test(websiteId)) {
      return res.status(400).set('Content-Type', 'application/json').json({
        error: 'Invalid websiteId format - must be alphanumeric with hyphens',
        code: 'INVALID_WEBSITE_ID',
        timestamp: new Date().toISOString(),
        errorType: 'ValidationError'
      });
    }
    
    Object.entries(pages).forEach(([fileName, content]) => {
      const sanitizedFileName = fileName.replace(/[^a-z0-9-]/gi, '_').substring(0, 50);
      const filePath = path.join(primaryDeployDir, `${sanitizedFileName}.html`);
      console.log('Attempting to write file:', filePath);
      try {
        fs.writeFileSync(filePath, content);
        console.log(`File written: ${filePath} (${content.length} bytes)`);
      } catch (writeError) {
        console.error('File write error:', {
          filePath,
          error: writeError.message,
          stack: writeError.stack
        });
        throw new Error(`Failed to write page: ${sanitizedFileName}`);
      }
    });

    const userDistDir = path.join(primaryDeployDir, 'dist');
    fs.mkdirSync(userDistDir, { recursive: true });
    const surgeCommand = `surge "${userDistDir.replace(/\\/g, '/')}" ${config.domain} --project ${websiteId}`;
    
    // Verify surge authentication
    try {
      execSync('surge whoami');
    } catch (authError) {
      console.error('Surge authentication check failed:', authError);
      return res.status(401).set('Content-Type', 'application/json').json({ 
        error: 'Surge authentication required', 
        details: 'Run: surge login or set SURGE_TOKEN environment variable' 
      });
    }

    console.log('Executing Surge command:', surgeCommand);
    exec(surgeCommand, { maxBuffer: 1024 * 1024 }, async (error, stdout, stderr) => {
      let hasResponded = false;
      const sendResponse = (status, data) => {
        if (!hasResponded) {
          hasResponded = true;
          res
            .status(status)
            .set('Content-Type', 'application/json')
            .json({
              ...data,
              timestamp: new Date().toISOString()
            });
        }
      };

      // Log the full output for debugging
      console.log('Surge command output:', {
        stdout: stdout?.toString(),
        stderr: stderr?.toString()
      });

      // Cleanup deployment directory after execution
      try {
        fs.rmSync(primaryDeployDir, { recursive: true, force: true });
        console.log('Deployment directory cleaned up successfully');
      } catch (cleanupError) {
        console.error('Cleanup failed:', {
          error: cleanupError.message,
          stack: cleanupError.stack,
          path: primaryDeployDir
        });
        // Don't fail the deployment if cleanup fails
        // Just log the error and continue
      }

      if (error || stderr) {
        const errorMessage = stderr?.toString() || error?.message;
        console.error('Surge deployment error:', {
          command: surgeCommand,
          error: error?.message,
          stderr: stderr?.toString(),
          stdout: stdout?.toString()
        });
        
        // Check for specific error conditions
        if (errorMessage?.includes('domain is already taken')) {
          sendResponse(409, {
            error: 'Domain conflict',
            details: 'The specified domain is already in use',
            code: 'DOMAIN_CONFLICT',
            timestamp: new Date().toISOString(),
            errorType: 'ConflictError'
          });
        } else if (errorMessage?.includes('not authorized')) {
          sendResponse(401, {
            error: 'Authentication failed',
            details: 'Please check your Surge credentials',
            code: 'AUTH_FAILED',
            timestamp: new Date().toISOString(),
            errorType: 'AuthenticationError'
          });
        } else if (errorMessage?.includes('ENOENT')) {
          sendResponse(500, {
            error: 'File system error',
            details: 'Failed to access deployment files',
            code: 'FILE_SYSTEM_ERROR',
            timestamp: new Date().toISOString(),
            errorType: 'IOError'
          });
        } else {
          sendResponse(500, {
            error: 'Deployment failed',
            details: errorMessage,
            code: 'DEPLOYMENT_FAILED',
            timestamp: new Date().toISOString(),
            errorType: 'DeploymentError'
          });
        }
        return;
      }
      
      // Verify successful deployment output
      if (!stdout?.includes('successfully published')) {
        console.error('Surge deployment suspicious output:', stdout);
        if (!hasResponded) {
          sendResponse(500, {
            error: 'Deployment verification failed',
            details: stdout
          });
        }
        return;
      }

      console.log('Surge deployment successful:', stdout);
      sendResponse(200, {
        surgeUrl: `https://${config.domain}`,
        deploymentId: websiteId
      });
    });

  } catch (error) {
    console.error('Surge deployment server error:', error);
    res.status(500).set('Content-Type', 'application/json').json({
      error: 'Internal server error',
      details: error.message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name || 'Error'
    });
  }
});

export default router;