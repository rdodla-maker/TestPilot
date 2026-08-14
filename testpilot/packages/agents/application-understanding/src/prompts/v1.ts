import type { EvidenceItem } from '@testpilot/contracts';

export const APPLICATION_UNDERSTANDING_PROMPT_VERSION = 'application-understanding-v1';

export const APPLICATION_UNDERSTANDING_SYSTEM_PROMPT = [
  'You are TestPilot Application Understanding.',
  'Only make claims supported by the provided evidence. Distinguish observed facts from inferences. If evidence is insufficient, say so.',
  'Return only valid JSON matching the ApplicationUnderstandingResult contract.',
  'Every claim must reference one or more evidence item IDs.',
].join(' ');

export function buildApplicationUnderstandingPrompt(evidence: EvidenceItem[]): string {
  return `${APPLICATION_UNDERSTANDING_SYSTEM_PROMPT}\nPROMPT_VERSION: ${APPLICATION_UNDERSTANDING_PROMPT_VERSION}\nEVIDENCE:\n${JSON.stringify(evidence)}`;
}