import { HttpResponse, http, type JsonBodyType } from 'msw';
import { server } from './msw-server';

// Must match `test.env.VITE_API_URL` in vitest.integration.config.ts so the
// axios `base` instance and these catch-all handlers share an origin.
export const API_BASE = 'http://api.test';

export type RecordedRequest = {
  callCount: number;
  method: string;
  pathname: string;
  search: string;
  contentType: string | null;
  body: unknown;
};

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Installs catch-all handlers for every HTTP method that record the next
 * request and return `response`. The returned object is populated while the
 * awaited client call is in flight, so assert on it after the call resolves.
 */
export function recordRequest(
  response: JsonBodyType = { ok: true },
): RecordedRequest {
  const record: RecordedRequest = {
    callCount: 0,
    method: '',
    pathname: '',
    search: '',
    contentType: null,
    body: undefined,
  };

  const handler = async ({ request }: { request: Request }) => {
    record.callCount += 1;

    // Capture the first request only; a later request can't silently overwrite
    // the one under assertion. Check `callCount` to assert an exact-one call.
    if (record.callCount === 1) {
      const url = new URL(request.url);
      const text = await request.clone().text();

      record.method = request.method;
      record.pathname = url.pathname;
      record.search = url.search;
      record.contentType = request.headers.get('content-type');
      record.body = text ? safeParse(text) : undefined;
    }

    return HttpResponse.json(response);
  };

  server.use(
    http.get(`${API_BASE}/*`, handler),
    http.post(`${API_BASE}/*`, handler),
    http.put(`${API_BASE}/*`, handler),
    http.patch(`${API_BASE}/*`, handler),
    http.delete(`${API_BASE}/*`, handler),
  );

  return record;
}
