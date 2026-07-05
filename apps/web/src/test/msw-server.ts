import { setupServer } from 'msw/node';

// Shared MSW server for web integration tests. Handlers are registered per-test
// via `server.use(...)` (see `recordRequest`) and reset after each test.
export const server = setupServer();
