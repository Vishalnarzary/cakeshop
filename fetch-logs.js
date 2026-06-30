const https = require('https');

https.get('https://api.github.com/repos/Vishalnarzary/cakeshop/actions/runs?per_page=1', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const run = JSON.parse(data).workflow_runs[0];
    console.log(`Latest Run ID: ${run.id}`);
    console.log(`Status: ${run.status}, Conclusion: ${run.conclusion}`);
    
    https.get(run.jobs_url, { headers: { 'User-Agent': 'Node.js' } }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const jobs = JSON.parse(data2).jobs;
        jobs.forEach(j => console.log(`Job: ${j.name} - ${j.status} - ${j.conclusion} (ID: ${j.id})`));
      });
    });
  });
});
