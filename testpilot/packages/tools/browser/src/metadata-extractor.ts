import { parseHTML } from 'linkedom';
import type { PageObservation } from './types';
import type {
  ApplicationPageMetadata,
  HeadingMetadata,
  LinkMetadata,
  ButtonMetadata,
  InputMetadata,
  SelectMetadata,
  TextareaMetadata,
  ImageMetadata,
  NavigationMetadata,
  InteractiveElementSummary,
} from '@testpilot/contracts';

export interface MetadataLimits {
  maxLinks: number;
  maxButtons: number;
  maxInputs: number;
  maxImages: number;
  maxHeadings: number;
  maxForms: number;
}

function normalizeText(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/\s+/g, ' ').trim();
}

function safeAttr(el: any, name: string): string | null {
  const v = el.getAttribute && el.getAttribute(name);
  return v == null ? null : String(v);
}

export function extractMetadataFromObservation(
  observation: PageObservation,
  limits: Partial<MetadataLimits> = {}
): ApplicationPageMetadata {
  console.info(JSON.stringify({ event: 'extractor.start', url: observation.finalUrl || observation.requestedUrl, timestamp: new Date().toISOString() }));
  const html = observation.html || '';
  const baseUrl = observation.finalUrl || observation.requestedUrl || 'about:blank';
  const doc = parseHTML(html).window.document;

  const pageTitle = normalizeText(doc.querySelector('title')?.textContent || '') || null;
  const description = safeAttr(doc.querySelector('meta[name="description"]'), 'content');
  const language = doc.documentElement?.getAttribute('lang') || null;
  const canonical = safeAttr(doc.querySelector('link[rel="canonical"]'), 'href');
  const viewport = safeAttr(doc.querySelector('meta[name="viewport"]'), 'content');
  const favicon = safeAttr(doc.querySelector('link[rel~="icon"]'), 'href');

  // Headings
  const headingsNodes = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  const headings: HeadingMetadata[] = headingsNodes.map((h: any) => {
    const tag = (h.tagName || 'H1').toLowerCase();
    const level = parseInt(tag.replace('h', ''), 10) as HeadingMetadata['level'];
    const text = normalizeText(h.textContent || '');
    return { level, text, normalizedText: text };
  });

  // Links
  const linkNodes = Array.from(doc.querySelectorAll('a'));
  const links: LinkMetadata[] = linkNodes.map((a: any) => {
    const text = normalizeText(a.textContent || '');
    const href = safeAttr(a, 'href');
    let absoluteUrl: string | null = null;
    if (href) {
      try {
        absoluteUrl = new URL(href, baseUrl).toString();
      } catch (_e) {
        absoluteUrl = null;
      }
    }
    return {
      text,
      href: href || null,
      absoluteUrl,
      target: safeAttr(a, 'target'),
      rel: safeAttr(a, 'rel'),
      ariaLabel: safeAttr(a, 'aria-label'),
    };
  });

  // Buttons (button elements and role=button)
  const buttonNodes = Array.from(doc.querySelectorAll('button,[role="button"]'));
  const buttons: ButtonMetadata[] = buttonNodes.map((b: any) => ({
    text: normalizeText(b.textContent || ''),
    type: safeAttr(b, 'type'),
    disabled: !!b.disabled,
    ariaLabel: safeAttr(b, 'aria-label'),
    title: safeAttr(b, 'title'),
    name: safeAttr(b, 'name'),
    id: safeAttr(b, 'id'),
  }));

  // Inputs
  const inputNodes = Array.from(doc.querySelectorAll('input'));
  const inputs: InputMetadata[] = inputNodes.map((i: any) => ({
    type: safeAttr(i, 'type') || null,
    name: safeAttr(i, 'name'),
    id: safeAttr(i, 'id'),
    placeholder: safeAttr(i, 'placeholder'),
    required: !!i.required,
    disabled: !!i.disabled,
    readOnly: !!i.readOnly,
    autoComplete: safeAttr(i, 'autocomplete'),
    ariaLabel: safeAttr(i, 'aria-label'),
  }));

  // Forms
  const formNodes = Array.from(doc.querySelectorAll('form'));
  const forms = formNodes.map((f: any) => ({
    action: safeAttr(f, 'action'),
    method: safeAttr(f, 'method'),
    id: safeAttr(f, 'id'),
    name: safeAttr(f, 'name'),
    fieldCount: (f.querySelectorAll('input,select,textarea,button') || []).length,
  }));

  // Selects
  const selectNodes = Array.from(doc.querySelectorAll('select'));
  const selects: SelectMetadata[] = selectNodes.map((s: any) => ({
    name: safeAttr(s, 'name'),
    id: safeAttr(s, 'id'),
    optionsCount: (s.options && s.options.length) || 0,
  }));

  // Textareas
  const textareaNodes = Array.from(doc.querySelectorAll('textarea'));
  const textareas: TextareaMetadata[] = textareaNodes.map((t: any) => ({
    name: safeAttr(t, 'name'),
    id: safeAttr(t, 'id'),
    placeholder: safeAttr(t, 'placeholder'),
    rows: t.rows ? Number(t.rows) : null,
  }));

  // Images
  const imgNodes = Array.from(doc.querySelectorAll('img'));
  const images: ImageMetadata[] = imgNodes.map((img: any) => ({
    src: safeAttr(img, 'src'),
    alt: safeAttr(img, 'alt'),
    width: img.width ? Number(img.width) : null,
    height: img.height ? Number(img.height) : null,
    loading: safeAttr(img, 'loading'),
    ariaLabel: safeAttr(img, 'aria-label'),
  }));

  // Navigation
  const navNodes = Array.from(doc.querySelectorAll('nav'));
  const navigation: NavigationMetadata[] = navNodes.map((nav: any) => ({
    label: safeAttr(nav, 'aria-label') || safeAttr(nav, 'role') || null,
    links: Array.from(nav.querySelectorAll('a')).map((a: any) => ({
      text: normalizeText(a.textContent || ''),
      href: safeAttr(a, 'href') || null,
      absoluteUrl: null,
      target: safeAttr(a, 'target'),
      rel: safeAttr(a, 'rel'),
      ariaLabel: safeAttr(a, 'aria-label'),
    })),
  }));

  // Summary
  const summary: InteractiveElementSummary = {
    links: links.length,
    buttons: buttons.length,
    inputs: inputs.length,
    forms: forms.length,
    selects: selects.length,
    textareas: textareas.length,
    images: images.length,
    headings: headings.length,
    navigationRegions: navigation.length,
  };

  // Apply limits and truncation
  const defaultLimits: MetadataLimits = {
    maxLinks: 500,
    maxButtons: 200,
    maxInputs: 200,
    maxImages: 500,
    maxHeadings: 200,
    maxForms: 50,
  };

  const appliedLimits: MetadataLimits = { ...defaultLimits, ...(limits as MetadataLimits) };
  let truncated = false;

  const trimmedLinks = links.slice(0, appliedLimits.maxLinks);
  if (links.length > appliedLimits.maxLinks) truncated = true;

  const trimmedButtons = buttons.slice(0, appliedLimits.maxButtons);
  if (buttons.length > appliedLimits.maxButtons) truncated = true;

  const trimmedInputs = inputs.slice(0, appliedLimits.maxInputs);
  if (inputs.length > appliedLimits.maxInputs) truncated = true;

  const trimmedImages = images.slice(0, appliedLimits.maxImages);
  if (images.length > appliedLimits.maxImages) truncated = true;

  const trimmedHeadings = headings.slice(0, appliedLimits.maxHeadings);
  if (headings.length > appliedLimits.maxHeadings) truncated = true;

  const trimmedForms = forms.slice(0, appliedLimits.maxForms);
  if (forms.length > appliedLimits.maxForms) truncated = true;

  const result: ApplicationPageMetadata = {
    page: {
      title: pageTitle,
      url: baseUrl,
      description: description || null,
      language: language || null,
      canonicalUrl: canonical || null,
      viewport: viewport || null,
      favicon: favicon || null,
    },
    headings: trimmedHeadings,
    links: trimmedLinks,
    buttons: trimmedButtons,
    inputs: trimmedInputs,
    forms: trimmedForms,
    selects,
    textareas,
    images: trimmedImages,
    navigation,
    summary,
    truncated,
  };

  console.info(JSON.stringify({ event: 'extractor.end', url: baseUrl, summary, truncated, timestamp: new Date().toISOString() }));
  return result;
}



