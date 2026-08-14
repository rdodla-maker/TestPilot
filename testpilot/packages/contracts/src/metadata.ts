/**
 * Metadata contracts for structured page metadata extraction
 */

export interface PageMetadata {
  title?: string | null;
  url: string;
  description?: string | null;
  language?: string | null;
  canonicalUrl?: string | null;
  viewport?: string | null;
  favicon?: string | null;
}

export interface HeadingMetadata {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  normalizedText: string;
}

export interface LinkMetadata {
  text: string;
  href: string | null;
  absoluteUrl?: string | null;
  target?: string | null;
  rel?: string | null;
  ariaLabel?: string | null;
}

export interface ButtonMetadata {
  text: string;
  type?: string | null;
  disabled?: boolean;
  ariaLabel?: string | null;
  title?: string | null;
  name?: string | null;
  id?: string | null;
}

export interface InputMetadata {
  type?: string | null;
  name?: string | null;
  id?: string | null;
  placeholder?: string | null;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string | null;
  ariaLabel?: string | null;
}

export interface SelectMetadata {
  name?: string | null;
  id?: string | null;
  optionsCount: number;
}

export interface TextareaMetadata {
  name?: string | null;
  id?: string | null;
  placeholder?: string | null;
  rows?: number | null;
}

export interface ImageMetadata {
  src?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  loading?: string | null;
  ariaLabel?: string | null;
}

export interface NavigationMetadata {
  label?: string | null;
  links: LinkMetadata[];
}

export interface InteractiveElementSummary {
  links: number;
  buttons: number;
  inputs: number;
  forms: number;
  selects: number;
  textareas: number;
  images: number;
  headings: number;
  navigationRegions: number;
}

export interface ApplicationPageMetadata {
  page: PageMetadata;
  headings: HeadingMetadata[];
  links: LinkMetadata[];
  buttons: ButtonMetadata[];
  inputs: InputMetadata[];
  forms: {
    action?: string | null;
    method?: string | null;
    id?: string | null;
    name?: string | null;
    fieldCount: number;
  }[];
  selects: SelectMetadata[];
  textareas: TextareaMetadata[];
  images: ImageMetadata[];
  navigation: NavigationMetadata[];
  summary: InteractiveElementSummary;
  truncated?: boolean;
}
