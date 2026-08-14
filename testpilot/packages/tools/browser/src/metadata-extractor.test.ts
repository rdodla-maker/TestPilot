import { describe, it, expect } from 'vitest';
import { extractMetadataFromObservation } from './metadata-extractor';

const simpleHtml = `<!doctype html>
<html lang="en">
<head>
  <title>  Example Site  </title>
  <meta name="description" content="This is an example site." />
  <link rel="canonical" href="https://example.com/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="/favicon.ico" />
</head>
<body>
  <nav aria-label="main-nav"><a href="/home">Home</a><a href="https://external.test/about">About</a></nav>
  <h1>  Welcome to Example  </h1>
  <h2>Features</h2>
  <a href="#section">Jump</a>
  <a href="mailto:info@example.com">Email us</a>
  <button id="btn1">Click me</button>
  <input type="text" id="q" name="q" placeholder="Search" required />
  <form id="f1" action="/submit" method="post"><input name="a" /></form>
  <select id="s1"><option>One</option><option>Two</option></select>
  <textarea id="t1" rows="4"></textarea>
  <img src="/img.png" alt="An image" />
</body>
</html>`;

describe('Metadata extractor', () => {
  it('extracts page metadata and counts', () => {
    const observation: any = {
      html: simpleHtml,
      finalUrl: 'https://example.com/page',
      requestedUrl: 'https://example.com/page',
      title: 'Example',
    };

    const meta = extractMetadataFromObservation(observation, { maxLinks: 10, maxButtons: 10 });

    expect(meta.page.title).toBe('Example Site');
    expect(meta.page.url).toBe('https://example.com/page');
    expect(meta.page.description).toBe('This is an example site.');
    expect(meta.headings.length).toBe(2);
    expect(meta.links.length).toBeGreaterThanOrEqual(3);
    expect(meta.buttons.length).toBe(1);
    expect(meta.inputs.length).toBe(2);
    expect(meta.forms.length).toBe(1);
    expect(meta.selects.length).toBe(1);
    expect(meta.textareas.length).toBe(1);
    expect(meta.images.length).toBe(1);
    expect(meta.navigation.length).toBe(1);
    expect(meta.summary.links).toBe(meta.links.length);
  });
});
