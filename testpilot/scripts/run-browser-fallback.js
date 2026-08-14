#!/usr/bin/env node
import { BrowserTool } from '../packages/tools/browser/dist/tools/browser/src/browser-tool.js';
import { extractMetadataFromObservation } from '../packages/tools/browser/dist/tools/browser/src/metadata-extractor.js';

const argv = process.argv.slice(2);
const url = argv[0] || 'http://localhost:8085/testpage.html';
const timeout = parseInt(argv[1], 10) || 30000;

(async ()=>{
  const tool = new BrowserTool();
  try{
    await tool.initialize();
    const ctx = { logger: console };
    const res = await tool.execute({ url, timeout, captureHtml: true, captureScreenshot: false }, ctx);
    if(res.success && res.output && res.output.observation){
      const observation = res.output.observation;
      const meta = extractMetadataFromObservation(observation, { maxLinks: 50, maxButtons: 50 });
      console.log(JSON.stringify({ success: true, observation, applicationMetadata: meta }));
    } else {
      console.log(JSON.stringify({ success: false, error: res.error || 'tool_failed' }));
    }
  }catch(e){
    console.log(JSON.stringify({ success: false, error: e.message }));
  }finally{
    try{ await tool.cleanup(); }catch(_){}
    process.exit(0);
  }
})();
