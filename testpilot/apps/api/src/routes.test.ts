import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createEnvironmentDiscoveryRoutes } from './routes';
import { ApplicationProfileService, InMemoryProfileRepository } from '@testpilot/database';
import { createLogger } from '@testpilot/observability';

function app() {
  const server = express();
  server.use(express.json());
  server.use(createEnvironmentDiscoveryRoutes(createLogger('error', 'text'), new ApplicationProfileService(new InMemoryProfileRepository())));
  return server;
}

describe('profile persistence API', () => {
  it('returns not found for a profile that has not been discovered', async () => {
    const response = await request(app()).get('/api/v1/projects/missing/profile');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('returns not found for missing current intelligence', async () => {
    const response = await request(app()).get('/api/v1/projects/missing/intelligence');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SNAPSHOT_NOT_FOUND');
  });
});