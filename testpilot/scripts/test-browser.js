import { BrowserTool } from '../packages/tools/browser/dist/tools/browser/src/browser-tool.js';
import { extractMetadataFromObservation } from '../packages/tools/browser/dist/tools/browser/src/metadata-extractor.js';
(async ()=>{
  const tool = new BrowserTool();
  try{
    await tool.initialize();
    const ctx = { logger: console };
    const res = await tool.execute({ url: 'http://localhost:8085/testpage.html', timeout: 30000, captureHtml: true, captureScreenshot: false }, ctx);
    console.log('TOOL RESULT', res.success);
    if(res.success){
      const observation = res.output.observation;
      const meta = extractMetadataFromObservation(observation, { maxLinks: 50, maxButtons: 50 });
      console.log('EXTRACTED METADATA', JSON.stringify(meta, null, 2));
    } else {
      console.error('Tool failed', res.error);
    }
  }catch(e){
    console.error('ERROR', e);
  }finally{
    await tool.cleanup();
    process.exit(0);
  }
})();
