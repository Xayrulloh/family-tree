import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw-server';

// Any request that escapes to MSW means a client/effect call wasn't mocked.
// `onUnhandledRequest: 'error'` only logs and lets the test pass, so record
// them and fail the test in afterEach for a clear signal instead.
const unhandledRequests: string[] = [];

beforeAll(() =>
  server.listen({
    onUnhandledRequest: (request) => {
      unhandledRequests.push(`${request.method} ${request.url}`);
    },
  }),
);

afterEach(() => {
  server.resetHandlers();

  if (unhandledRequests.length > 0) {
    const escaped = unhandledRequests.splice(0).join('\n');

    throw new Error(
      `Unhandled request(s) escaped to MSW — mock them:\n${escaped}`,
    );
  }
});

afterAll(() => server.close());
