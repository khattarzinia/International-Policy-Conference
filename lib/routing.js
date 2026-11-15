// Standalone Vercel functions use explicit rewrites for multiple path segments.
// The query parameter preserves the requested route if the host replaces URL.pathname.
export function routedRequest(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('ipc_route');
  if (path === null) return request;
  url.pathname = `/api/${path}`;
  url.searchParams.delete('ipc_route');
  return new Request(url, request);
}
