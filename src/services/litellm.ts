import { CONFIG } from '../config';

const MODEL_MAP: Record<string, string> = {
  'claude-sonnet-4-6': 'anthropic-claude',
  'gpt-5': 'anthropic-claude',
  'gemini-2-5-pro': 'anthropic-claude',
};

function mapModel(pref?: string): string {
  if (!pref) return 'anthropic-claude';
  return MODEL_MAP[pref] ?? 'anthropic-claude';
}

export async function callLitellm(message: string, model_preference?: string) {
  const model = mapModel(model_preference);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${CONFIG.LITELLM_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.LITELLM_MASTER_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 800,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LiteLLM ${res.status} ${res.statusText}: ${text}`);
    }
    const data: any = await res.json();
    const response_text = data?.choices?.[0]?.message?.content;
    if (typeof response_text !== 'string') {
      throw new Error('LiteLLM response missing choices[0].message.content');
    }
    return {
      response_text,
      llm_provider_used: model,
      tokens_used: typeof data?.usage?.total_tokens === 'number' ? data.usage.total_tokens : null,
    };
  } finally {
    clearTimeout(timer);
  }
}
