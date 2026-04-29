export const config = {
  runtime: "edge",
};

const TARGET_BASE = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");

const STRIP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-vercel-id",
  "x-vercel-ip",
]);

export default async function handler(req) {
  if (!TARGET_BASE) {
    return new Response("Misconfigured: TARGET_DOMAIN is not set", { status: 500 });
  }

  try {
    const url = new URL(req.url);
    // ساخت URL هدف - این روش مطمئن‌تر است
    const targetPath = url.pathname === "/" ? "" : url.pathname;
    const targetUrl = TARGET_BASE + targetPath + url.search;

    const headers = new Headers();

    for (const [key, value] of req.headers) {
      const lowerKey = key.toLowerCase();
      if (STRIP_HEADERS.has(lowerKey)) continue;
      if (lowerKey.startsWith("x-vercel-")) continue;

      headers.set(key, value);
    }

    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: "manual",
    };

    // مدیریت body برای XHTTP (مهم)
    if (req.body && !["GET", "HEAD"].includes(req.method)) {
      fetchOptions.body = req.body;
      fetchOptions.duplex = "half";
    }

    const response = await fetch(targetUrl, fetchOptions);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (err) {
    console.error("Relay Error:", err);
    return new Response("Bad Gateway: Tunnel Failed", { status: 502 });
  }
}
