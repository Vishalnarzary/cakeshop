const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  // Get latest runs
  const runsRes = await get('https://api.github.com/repos/Vishalnarzary/cakeshop/actions/runs?per_page=3');
  const runs = JSON.parse(runsRes.body).workflow_runs;
  
  for (const run of runs) {
    console.log(`\n=== Run #${run.run_number} | ${run.status} | ${run.conclusion} | ${run.head_commit?.message?.split('\n')[0]} ===`);
    console.log(`  Created: ${run.created_at}`);
    
    // Get jobs
    const jobsRes = await get(run.jobs_url);
    const jobs = JSON.parse(jobsRes.body).jobs;
    for (const job of jobs) {
      console.log(`  Job: ${job.name} => ${job.conclusion}`);
      if (job.conclusion === 'failure') {
        // Get failed steps
        for (const step of job.steps) {
          if (step.conclusion === 'failure') {
            console.log(`    FAILED STEP: ${step.name} (${step.number})`);
          }
        }
      }
    }
  }
  
  // Get annotations for the latest failed run
  const latestFailed = runs.find(r => r.conclusion === 'failure');
  if (latestFailed) {
    console.log(`\n\n=== ANNOTATIONS for Run #${latestFailed.run_number} ===`);
    const annotRes = await get(`https://api.github.com/repos/Vishalnarzary/cakeshop/check-runs?head_sha=${latestFailed.head_sha}`);
    // Try check suites
    const annRes2 = await get(`https://api.github.com/repos/Vishalnarzary/cakeshop/commits/${latestFailed.head_sha}/check-runs`);
    const checkRuns = JSON.parse(annRes2.body);
    if (checkRuns.check_runs) {
      for (const cr of checkRuns.check_runs) {
        console.log(`  Check: ${cr.name} => ${cr.conclusion}`);
        if (cr.output?.summary) {
          console.log(`  Summary: ${cr.output.summary.substring(0, 2000)}`);
        }
        if (cr.output?.text) {
          console.log(`  Text: ${cr.output.text.substring(0, 3000)}`);
        }
      }
    }
  }
})();
