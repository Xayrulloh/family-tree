/// <reference types="jest" />
import { closeTestDb } from './test-db';

// Jest gives each spec file its own module registry, so the test-db singleton
// (and its pg Pool) is re-created per file. Close it after each file to avoid
// leaking connections across the suite.
afterAll(async () => {
  await closeTestDb();
});
