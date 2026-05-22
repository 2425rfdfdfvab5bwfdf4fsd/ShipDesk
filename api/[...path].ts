// Vercel serverless proxy — forwards all /api/* requests to BACKEND_URL.
// Set BACKEND_URL in Vercel → Project Settings → Environment Variables.
// Example: https://your-project.replit.app  (no trailing slash)

export default async function handler(req: any, res: any) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

  if (!backendUrl) {
    res.status(503).json({
      error: "BACKEND_NOT_CONFIGURED",
      message:
        "Set BACKEND_URL in Vercel → Project Settings → Environment Variables (e.g. https://your-backend.replit.app)",
    });
    return;
  }

  const url = `${backendUrl}${req.url ?? "/api"}`;

  const headers: Record<string, string> = {};

  const auth = req.headers["authorization"];
  if (auth) headers["authorization"] = Array.isArray(auth) ? auth[0] : auth;

  const cookie = req.headers["cookie"];
  if (cookie) headers["cookie"] = Array.isArray(cookie) ? cookie[0] : cookie;

  const hasBody =
    req.method !== "GET" && req.method !== "HEAD" && req.body != null;
  if (hasBody) headers["content-type"] = "application/json";

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method ?? "GET",
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined,
      redirect: "manual",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({
      error: "BACKEND_UNREACHABLE",
      message: `Could not reach backend at ${backendUrl}: ${msg}`,
    });
    return;
  }

  // Forward redirect responses (e.g. GitHub OAuth) directly to the browser
  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.setHeader("set-cookie", setCookie);
    if (location) res.setHeader("location", location);
    res.status(upstream.status).send();
    return;
  }

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  res.setHeader("content-type", contentType);

  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) res.setHeader("set-cookie", setCookie);

  res.status(upstream.status).send(await upstream.text());
}
