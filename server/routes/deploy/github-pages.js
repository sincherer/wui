import { Router } from 'express';
import { Octokit } from '@octokit/rest';

export const router = Router();

router.post('/', async (req, res) => {
 try {
 const { websiteId, pages } = req.body;
 const octokit = new Octokit({
 auth: process.env.GH_TOKEN,
 });

 // Create repository
 const repo = await octokit.repos.createForAuthenticatedUser({
 name: `website-${websiteId}`,
 private: false,
 auto_init: true,
 });

 // Create gh-pages branch
 await octokit.repos.createOrUpdateFileContents({
 owner: repo.data.owner.login,
 repo: repo.data.name,
 branch: 'gh-pages',
 path: 'index.html',
 message: 'Initial commit',
 content: Buffer.from(pages.index?.content || '').toString('base64'),
 });

 res.json({
 repoUrl: repo.data.html_url,
 pageUrl: `https://${repo.data.owner.login}.github.io/${repo.data.name}`
 });

 } catch (error) {
 console.error('GitHub Pages deployment error:', error);
 res.status(500).json({ error: error.message });
 }
});