const https = require('https');

https.get('https://api.github.com/repos/Vishalnarzary/cakeshop/actions/jobs/84286641549/logs', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  if (res.statusCode === 302) {
    https.get(res.headers.location, { headers: { 'User-Agent': 'Node.js' } }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        // print last 10000 characters
        console.log(data2.substring(data2.length - 10000));
      });
    });
  }
});
