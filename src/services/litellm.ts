import fetch from 'node-fetch';
import { CONFIG } from '../config';
/**
 * Mock Litellm service wrapper.
 * In production this would POST to `${CONFIG.LITELLM_URL}/chat/completions`.
 * The function accepts a `providerId` (from CONFIG.LLM_PROVIDERS) and optional BYOK params.
 * For the MVP we ignore BYOK and always return a deterministic mock response.
 */
export async function callLitellm(
  message: string,
  providerId: string = CONFIG.LLM_PROVIDERS[0].id,
  byokProvider?: string,
  byokApiKey?: string,
) {
  // Mock provider selection – we just echo the providerId.
  const provider = providerId;
  const model = CONFIG.LLM_PROVIDERS.find(p => p.id === providerId)?.defaultModel || 'claude-sonnet';
  const response = `Mock response from ${provider}/${model} for: ${message}`;

  // Simulate async latency.
  await new Promise(r => setTimeout(r, 50));

  return {
    llm_provider_used: provider,
    llm_model: model,
    llm_response: response,
  };
}
