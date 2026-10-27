import test from 'node:test';
import assert from 'node:assert/strict';
import { routedRequest } from '../lib/routing.js';

test('Vercel rewrite preserves nested API routes, query parameters, cookies and request body', async () => {
  const request = new Request('https://ipc.example/api/index?ipc_route=admin%2Freview&id=example', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'session=private', Origin: 'https://ipc.example' },
    body: JSON.stringify({ notes: 'A review note.' }),
  });
  const routed = routedRequest(request);
  assert.equal(new URL(routed.url).pathname, '/api/admin/review');
  assert.equal(new URL(routed.url).searchParams.get('id'), 'example');
  assert.equal(new URL(routed.url).searchParams.has('ipc_route'), false);
  assert.equal(routed.headers.get('cookie'), 'session=private');
  assert.equal(routed.method, 'POST');
  assert.deepEqual(await routed.json(), { notes: 'A review note.' });
});

test('development requests already have their route and need no rewrite', () => {
  const request = new Request('http://localhost:4318/api/config');
  assert.equal(routedRequest(request), request);
});
