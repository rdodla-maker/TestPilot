import { createMockProvider } from './mock-provider';

test('mock provider returns parsed understanding', async () => {
  const p = createMockProvider();
  const r = await p.callModel('evidence');
  expect(r.parsed).toBeDefined();
  expect(r.parsed?.evidence.length).toBeGreaterThan(0);
});
