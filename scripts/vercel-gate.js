const https = require('https');

const owner =
  process.env.VERCEL_GIT_REPO_OWNER ||
  (process.env.GITHUB_REPOSITORY || '').split('/')[0] ||
  'Vishalnarzary';
const repo =
  process.env.VERCEL_GIT_REPO_SLUG ||
  (process.env.GITHUB_REPOSITORY || '').split('/')[1] ||
  'cakeshop';
const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
const requiredCheckName = process.env.REQUIRED_CHECK_NAME || 'Run Playwright Tests';
const timeoutMs = Number(process.env.VERCEL_GATE_TIMEOUT_MS || 12 * 60 * 1000);
const intervalMs = Number(process.env.VERCEL_GATE_INTERVAL_MS || 15 * 1000);
const token = process.env.GITHUB_TOKEN || process.env.VERCEL_GITHUB_TOKEN;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function requestJson(url) {
  const headers = {
    'User-Agent': 'vercel-gate',
    Accept: 'application/vnd.github+json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, res => {
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`GitHub API returned ${res.statusCode}: ${body}`));
            return;
          }
          resolve(JSON.parse(body));
        });
      })
      .on('error', reject);
  });
}

async function getRequiredCheck() {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`;
  const data = await requestJson(url);
  return (data.check_runs || []).find(check => check.name === requiredCheckName);
}

async function main() {
  if (!sha) {
    console.log('No commit SHA found. Cancelling Vercel deployment.');
    process.exit(0);
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const check = await getRequiredCheck();

    if (!check) {
      console.log(`Waiting for required GitHub check: ${requiredCheckName}`);
      await wait(intervalMs);
      continue;
    }

    console.log(`${requiredCheckName}: ${check.status} / ${check.conclusion || 'pending'}`);

    if (check.status !== 'completed') {
      await wait(intervalMs);
      continue;
    }

    if (check.conclusion === 'success') {
      console.log('Playwright passed. Allowing Vercel deployment.');
      process.exit(1);
    }

    console.log(`Playwright did not pass (${check.conclusion}). Cancelling Vercel deployment.`);
    process.exit(0);
  }

  console.log('Timed out waiting for Playwright. Cancelling Vercel deployment.');
  process.exit(0);
}

main().catch(error => {
  console.error(error.message);
  process.exit(0);
});
