import fs from 'fs';
import path from 'path';
import { EnvironmentDiscoveryAgent } from '../../packages/agents/environment-discovery/dist/agents/environment-discovery/src/environment-discovery-agent.js';

async function run() {
  const fixturePath = path.resolve(__dirname, '..', '..', 'test-fixtures', 'testpage.html');
  const html = fs.readFileSync(fixturePath, { encoding: 'utf8' });
  const dataUrl = `data:text/html;base64,${Buffer.from(html, 'utf8').toString('base64')}`;

  // Build a fake observation similar to BrowserTool output
  const observation = {
    requestedUrl: dataUrl,
    finalUrl: dataUrl,
    title: 'Test Page for Environment Discovery',
    viewport: { width: 1920, height: 1080 },
    html,
    screenshot: { path: '/tmp/fake.png' },
    navigationStatus: { status: 200, statusText: 'OK', url: dataUrl },
    loadDuration: 100,
    timestamp: new Date(),
  };

  const agent = new EnvironmentDiscoveryAgent();

  // Stub the browserTool to return our observation without launching Playwright
  (agent as any).browserTool = {
    execute: async (_input: any, _context: any) => ({ success: true, output: { observation } }),
    cleanup: async () => {},
  };

  const context = {
    executionId: 'direct-test-1',
    logger: {
      info: (msg: any, meta?: any) => console.info(JSON.stringify({ level: 'info', message: msg, context: meta })),
      debug: (msg: any, meta?: any) => console.info(JSON.stringify({ level: 'debug', message: msg, context: meta })),
      warn: (msg: any, meta?: any) => console.info(JSON.stringify({ level: 'warn', message: msg, context: meta })),
      error: (msg: any, meta?: any) => console.error(JSON.stringify({ level: 'error', message: msg, context: meta })),
    },
    cancellationToken: { aborted: false },
  } as any;

  const result = await agent.execute({ projectId: 'diag', url: dataUrl }, context as any);
  console.info('Direct agent result:', JSON.stringify(result, null, 2));
}

run().catch(e => console.error('Direct run failed', e));
