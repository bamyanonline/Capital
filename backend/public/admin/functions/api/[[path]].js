export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const upstreamOrigin = String(env.CAPITAL_API_ORIGIN || 'https://capital-api.bamyanonline.workers.dev').replace(/\/$/, '');
  const target = upstreamOrigin + url.pathname + url.search;
  const headers = new Headers(request.headers);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) headers.set('CF-Connecting-IP', ip);
  headers.delete('Host');
  const init = { method: request.method, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;
  const upstream = await fetch(target, init);
  const out = new Response(upstream.body, upstream);
  out.headers.set('Cache-Control', 'no-store');
  return out;
}
