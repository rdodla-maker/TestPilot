import type { AIProvider } from './index';
import type { ApplicationUnderstandingResult } from '@testpilot/contracts';

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async callModel(prompt: string): Promise<{ text: string; parsed?: ApplicationUnderstandingResult }>{
    // simple deterministic mock: return a minimal ApplicationUnderstandingResult
    const result: ApplicationUnderstandingResult = {
      applicationType: { value: 'web', evidence: [{ id: 'e1', text: 'page title present' }] },
      applicationPurpose: { value: 'demo', evidence: [{ id: 'e2', text: 'has links and forms' }] },
      businessDomain: { value: 'unknown', evidence: [] },
      userRoles: [{ role: 'user', evidence: [{ id: 'e3', text: 'has login link' }] }],
      features: [{ name: 'search', evidence: [{ id: 'e4', text: 'input with name=search' }] }],
      workflows: [],
      riskAreas: [],
      confidence: 0.6,
      evidence: [
        { id: 'e1', text: 'title: Test Page' },
        { id: 'e2', text: 'has links and forms' },
        { id: 'e3', text: 'has login link' },
        { id: 'e4', text: 'search input' },
      ],
    };

    return {
      text: JSON.stringify(result),
      parsed: result,
    };
  }
}

export const createMockProvider = () => new MockAIProvider();
