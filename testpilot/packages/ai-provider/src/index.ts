import type { ApplicationUnderstandingResult } from '@testpilot/contracts';

export type ModelCallOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
};

export interface AIProvider {
  name: string;
  callModel(prompt: string, options?: ModelCallOptions): Promise<{
    text: string;
    parsed?: ApplicationUnderstandingResult | null;
    usage?: { promptTokens?: number; completionTokens?: number };
  }>;
}

export * from './mock-provider.js';
