import { BaseAgent } from '@testpilot/core';
import type { ExecutionContext } from '@testpilot/contracts';
import type { ApplicationUnderstandingRequest, ApplicationUnderstandingResult } from '@testpilot/contracts';
import { createAgentId } from '@testpilot/contracts';
import type { AIProvider, ModelCallOptions } from '@testpilot/ai-provider';
import { createMockProvider } from '@testpilot/ai-provider';
import { getMetadataLimits } from '@testpilot/config';
import type { ApplicationPageMetadata, EvidenceItem } from '@testpilot/contracts';
import { buildApplicationUnderstandingPrompt, APPLICATION_UNDERSTANDING_PROMPT_VERSION } from './prompts/v1.js';
import { isApplicationUnderstandingResult } from './validation.js';

export { buildApplicationUnderstandingPrompt, APPLICATION_UNDERSTANDING_PROMPT_VERSION } from './prompts/v1.js';
export { isApplicationUnderstandingResult } from './validation.js';
export {
  buildApplicationIntelligence,
  buildApplicationIntelligenceSnapshot,
  validateApplicationIntelligenceSnapshot,
  ApplicationIntelligenceValidationError,
} from './intelligence.js';

export interface ApplicationUnderstandingAgentInput extends ApplicationUnderstandingRequest {}

export interface ApplicationUnderstandingAgentOutput {
  status: 'success' | 'failed';
  result?: ApplicationUnderstandingResult;
  error?: unknown;
}

export function prepareEvidence(metadata: ApplicationPageMetadata): EvidenceItem[] {
  const limits = getMetadataLimits();
  const evidence: EvidenceItem[] = [];
  const add = (id: string, source: string, value: unknown) => {
    if (value === undefined || value === null) return;
    evidence.push({ id, source, text: typeof value === 'string' ? value : JSON.stringify(value) });
  };

  add('page', 'page', metadata.page);
  metadata.headings.slice(0, limits.maxHeadings).forEach((item, index) => add(`heading-${index}`, `headings[${index}]`, item));
  metadata.links.slice(0, limits.maxLinks).forEach((item, index) => add(`link-${index}`, `links[${index}]`, item));
  metadata.buttons.slice(0, limits.maxButtons).forEach((item, index) => add(`button-${index}`, `buttons[${index}]`, item));
  metadata.inputs.slice(0, limits.maxInputs).forEach((item, index) => add(`input-${index}`, `inputs[${index}]`, item));
  metadata.images.slice(0, limits.maxImages).forEach((item, index) => add(`image-${index}`, `images[${index}]`, item));
  metadata.forms.slice(0, limits.maxForms).forEach((item, index) => add(`form-${index}`, `forms[${index}]`, item));
  add('summary', 'summary', metadata.summary);
  return evidence;
}

export class ApplicationUnderstandingAgent extends BaseAgent<ApplicationUnderstandingAgentInput, ApplicationUnderstandingAgentOutput> {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    super(createAgentId('application-understanding-agent'), 'Application Understanding Agent', 'Analyzes application metadata to produce structured understanding');
    this.provider = provider || createMockProvider();
  }

  protected async onExecute(input: ApplicationUnderstandingAgentInput, context: ExecutionContext) {
    context.logger.info('ApplicationUnderstandingAgent starting', { projectId: input.projectId });

    if (!input.applicationMetadata) {
      const err = new Error('Missing applicationMetadata');
      context.logger.error('ApplicationUnderstandingAgent missing input', err as Error);
      return { status: 'failed', error: err } as ApplicationUnderstandingAgentOutput;
    }

    try {
      const evidenceItems = prepareEvidence(input.applicationMetadata as ApplicationPageMetadata);
      const prompt = buildApplicationUnderstandingPrompt(evidenceItems);
      const startedAt = Date.now();
      const call = await this.provider.callModel(prompt, { provider: this.provider.name } as ModelCallOptions);
      const latencyMs = Date.now() - startedAt;

      // Try to parse provider output as JSON
      let parsed: ApplicationUnderstandingResult | undefined;
      if (call.parsed) parsed = call.parsed;
      else {
        try {
          parsed = JSON.parse(call.text) as ApplicationUnderstandingResult;
        } catch (e) {
          context.logger.error('ApplicationUnderstandingAgent failed to parse provider output', e as Error, {
            executionId: context.executionId,
            promptVersion: APPLICATION_UNDERSTANDING_PROMPT_VERSION,
          });
          return { status: 'failed', error: new Error('Invalid provider output') } as ApplicationUnderstandingAgentOutput;
        }
      }

      if (!isApplicationUnderstandingResult(parsed)) {
        context.logger.error('ApplicationUnderstandingAgent received invalid provider schema', new Error('Schema validation failed'), {
          executionId: context.executionId,
          promptVersion: APPLICATION_UNDERSTANDING_PROMPT_VERSION,
        });
        return { status: 'failed', error: new Error('Invalid provider schema') } as ApplicationUnderstandingAgentOutput;
      }

      context.logger.info('ApplicationUnderstandingAgent completed', {
        executionId: context.executionId,
        agent: this.id,
        provider: this.provider.name,
        model: undefined,
        promptVersion: APPLICATION_UNDERSTANDING_PROMPT_VERSION,
        latencyMs,
        inputBytes: Buffer.byteLength(prompt),
        outputBytes: Buffer.byteLength(call.text),
        promptTokens: call.usage?.promptTokens,
        completionTokens: call.usage?.completionTokens,
        projectId: input.projectId,
        confidence: parsed.confidence,
      });

      return { status: 'success', result: parsed } as ApplicationUnderstandingAgentOutput;
    } catch (err) {
      context.logger.error('ApplicationUnderstandingAgent failed', err as Error);
      return { status: 'failed', error: err } as ApplicationUnderstandingAgentOutput;
    }
  }
}

export default ApplicationUnderstandingAgent;
