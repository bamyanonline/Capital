const DEFAULT_API_ORIGIN = "https://capital-api.bamyanonline.workers.dev";

function apiOrigin(env) {
  return String(env.CAPITAL_API_ORIGIN || DEFAULT_API_ORIGIN).replace(/\/$/, "");
}

export async function onRequest(context) {
  const { request, env } = context;
  const incoming = new URL(request.url);
  const target = new URL(apiOrigin(env));
  target.pathname = incoming.pathname;
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  // The browser talks only to capitalism.pages.dev. The backend still receives
  // the original Origin so it can enforce its allow-list and build correct
  // password-reset links.
  headers.set("Origin", incoming.origin);
  headers.delete("Host");

  const forwardedIp = request.headers.get("CF-Connecting-IP");
  if (forwardedIp) headers.set("X-Forwarded-For", forwardedIp);

  const upstream = await fetch(new Request(target.toString(), {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual"
  }));

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.delete("Content-Length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
