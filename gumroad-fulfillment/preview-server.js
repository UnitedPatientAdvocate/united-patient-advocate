const http = require('http');
const fs = require('fs');
const path = require('path');
const base = path.join(__dirname);

http.createServer(function(req, res) {
  const name = req.url === '/' ? 'UPA-Billing-Review-Access.html' : req.url.slice(1);
  const file = path.join(base, name);
  const ct = name.endsWith('.css') ? 'text/css'
           : name.endsWith('.js')  ? 'application/javascript'
           : 'text/html';
  try {
    const data = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': ct });
    res.end(data);
  } catch(e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found: ' + name);
  }
}).listen(7123, function() {
  console.log('UPA fulfillment preview ready on port 7123');
});
