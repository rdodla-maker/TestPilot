import path from 'path';
import { Orchestrator } from '@testpilot/orchestrator';
import { EnvironmentDiscoveryWorkflow } from '@testpilot/workflows';

async function run() {
  const orchestrator = new Orchestrator();
  const workflow = new EnvironmentDiscoveryWorkflow();

  // local fixture
  const fixturePath = path.resolve(__dirname, '..', '..', 'test-fixtures', 'testpage.html');
  const fs = await import('fs');
  const html = fs.readFileSync(fixturePath, { encoding: 'utf8' });
  const dataUrl = `data:text/html;base64,${Buffer.from(html, 'utf8').toString('base64')}`;

  console.info(JSON.stringify({ event: 'diagnostic.start', fixture: fixturePath, dataUrlPreview: dataUrl.slice(0, 64), timestamp: new Date().toISOString() }));

  try {
    const request = {
      projectId: 'diagnostic-project',
      workflowId: 'environment-discovery-workflow',
      input: {
        projectId: 'diagnostic-project',
        url: dataUrl,
        timeout: 30000,
      },
    } as any;

    const resp = await orchestrator.execute(workflow as any, request as any);
    console.info(JSON.stringify({ event: 'diagnostic.completed', resultStatus: resp.result?.status, duration: resp.duration, timestamp: new Date().toISOString() }));
    console.info('Full result:', JSON.stringify(resp, null, 2));
  } catch (err) {
    console.error('Diagnostic failed', err);
  }
}

run();
