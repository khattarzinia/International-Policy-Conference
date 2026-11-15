import { createApp } from '../lib/app.js';
import { routedRequest } from '../lib/routing.js';

let app;
export default {
  async fetch(request) {
    try {
      app ||= createApp();
      return (await app).fetch(routedRequest(request));
    } catch (error) {
      app = null;
      console.error('IPC service initialization failed:', error.name);
      return Response.json({ error: 'The submission service is not configured yet.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  },
};
