import { Request, Response } from 'express';
/**
 * Types for the /chat endpoint request and response.
 */
export interface ChatRequest {
  message: string;
  session_id?: string;
  model_preference?: string; // maps to provider id in CONFIG.LLM_PROVIDERS
  byok_provider?: string;
  byok_api_key?: string;
}

export interface HalSignals {
  harm_probability: number;
  epistemic_uncertainty: number;
  evidence_quality: number;
  scope_appropriateness: number;
  certainty_at_claim: number;
}

export interface HalResult {
  score: number;
  signals: HalSignals;
  verdict: 'APPROVED' | 'FLAGGED' | 'VETOED';
  flagged_hallucination: boolean;
}

export interface TokenStats {
  used: number | null;
  baseline_estimate: number | null;
  savings_pct: number | null;
}

export interface ChatSuccessResponse {
  session_id: string;
  response: string;
  llm_provider_used: string;
  prompt_count_today: number;
  prompts_remaining_today: number | null;
  hal: HalResult;
  token_stats: TokenStats;
  latency_ms: number;
  score_event_id: number;
}

export interface ChatVetoResponse {
  session_id: string;
  response: null;
  llm_provider_used: string;
  prompt_count_today: number;
  prompts_remaining_today: number | null;
  hal: HalResult;
  token_stats: TokenStats;
  latency_ms: number;
  score_event_id: number;
  veto_reason: string;
  suggested_rephrase?: string;
}

export interface ChatErrorResponse {
  error: string;
}
