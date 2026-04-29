const http = require('http');

const TARGET_BASE = (process.env.TARGET_DOMAIN || '').replace(/\/$/, '');

if (!TARGET_BASE) {
  console.error("❌ TARGET_DOMAIN is not set!");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  try {
    const targetUrl = TARGET_BASE + req.url;

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers['keep-alive'];
    delete headers['transfer-encoding'];

    const options = {
      method: req.method,
      headers: headers,
      redirect: 'manual',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req;
    }

    const response = await fetch(targetUrl, options);

    res.writeHead(response.status, Object.fromEntries(response.headers));

    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }

  } catch (err) {
    console.error("Relay Error:", err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    res.end("Bad Gateway");
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 XHTTP Relay listening on port ${PORT}`);
  console.log(`Target: ${TARGET_BASE}`);
});
