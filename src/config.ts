import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  LITELLM_URL: process.env.LITELLM_URL || '',
  LITELLM_MASTER_KEY: process.env.LITELLM_MASTER_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  REPID_API_KEY: process.env.REPID_API_KEY || '',
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  // V1 architecture: list of LLM providers (id, name, defaultModel)
  LLM_PROVIDERS: [
    { id: 'anthropic', name: 'Anthropic', defaultModel: 'claude-sonnet' },
    // future providers can be added here
  ] as const,
};
