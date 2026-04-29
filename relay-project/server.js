import http from "http";

const TARGET = process.env.TARGET_DOMAIN;

http.createServer(async (req, res) => {
  try {
    const url = TARGET + req.url;

    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.method === "GET" ? undefined : req,
    });

    res.writeHead(response.status, Object.fromEntries(response.headers));
    response.body.pipe(res);

  } catch (e) {
    res.statusCode = 502;
    res.end("Bad Gateway");
  }
}).listen(process.env.PORT || 3000);
