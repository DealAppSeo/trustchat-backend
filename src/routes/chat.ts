import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { callLitellm } from '../services/litellm';
import { scoreWithHal } from '../services/hal';
import { supabaseClient } from '../services/supabase';
import {
  ChatRequest,
  ChatSuccessResponse,
  ChatVetoResponse,
  ChatErrorResponse,
} from '../types/chat';

/**
 * POST /chat handler (mock integration with V1‑ready schema).
 *
 * The MVP does not enforce daily limits or BYOK usage, but the request
 * schema accepts those fields and the database schema tracks them for
 * future enforcement.
 */
export default async function chatHandler(req: Request, res: Response) {
  const {
    message,
    session_id,
    model_preference,
    byok_provider,
    byok_api_key,
  } = req.body as ChatRequest;

  // ---- Validation ----
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required and must be a non‑empty string.' } as ChatErrorResponse);
  }
  if (message.length > 4000) {
    return res.status(400).json({ error: 'Message exceeds maximum length of 4000 characters.' } as ChatErrorResponse);
  }

  const sessId = session_id || uuidv4();
  const start = Date.now();

  // ---- Determine LLM provider ----
  // model_preference maps to a provider id; default to first provider.
  const providerId = model_preference || (require('../config').CONFIG.LLM_PROVIDERS[0].id as string);

  // ---- Call mock Litellm ----
  let llmResult;
  try {
    llmResult = await callLitellm(message, providerId, byok_provider, byok_api_key);
  } catch (err) {
    console.error('Litellm error:', err);
    return res.status(504).json({ error: 'LLM service timed out.' } as ChatErrorResponse);
  }

  // ---- Score with HAL (mock) ----
  let halResult;
  try {
    halResult = await scoreWithHal(llmResult.llm_response, sessId);
  } catch (err) {
    console.error('HAL scoring error:', err);
    const latency = Date.now() - start;
    // Persist with minimal data, indicate scoring unavailable
    await supabaseClient.from('trustchat_sessions').insert({
      session_id: sessId,
      session_date: new Date().toISOString().split('T')[0],
      prompt_count_in_session: 1,
      user_message: message,
      llm_provider_used: llmResult.llm_provider_used,
      llm_model: llmResult.llm_model,
      llm_response: llmResult.llm_response,
      latency_ms: latency,
    });
    return res.json({
      session_id: sessId,
      response: llmResult.llm_response,
      llm_provider_used: llmResult.llm_provider_used,
      prompt_count_today: 1,
      prompts_remaining_today: 9,
      hal: null,
      token_stats: { used: null, baseline_estimate: null, savings_pct: null },
      latency_ms: latency,
    } as any);
  }

  const latency = Date.now() - start;

  // ---- Prompt count tracking (mock) ----
  // In a real implementation we would query by IP hash + date.
  const promptCountToday = 1; // placeholder for MVP
  const promptsRemainingToday = 9; // placeholder (10 - count)

  // ---- Persist full session record ----
  try {
    await supabaseClient.from('trustchat_sessions').insert({
      session_id: sessId,
      session_date: new Date().toISOString().split('T')[0],
      prompt_count_in_session: promptCountToday,
      user_ip_hash: null, // IP hashing not implemented yet
      user_message: message,
      byok_provider: byok_provider || null,
      llm_provider_used: llmResult.llm_provider_used,
      llm_model: llmResult.llm_model,
      llm_response: llmResult.llm_response,
      hal_score: halResult.hal_score,
      hal_signals: halResult.hal_signals,
      hal_verdict: halResult.hal_verdict,
      hal_flagged_hallucination: halResult.hal_flagged_hallucination,
      tokens_used: halResult.tokens_used,
      tokens_baseline: null,
      latency_ms: latency,
      score_event_id: halResult.score_event_id,
      rating: null,
      rating_feedback: null,
      rated_at: null,
    });
  } catch (err) {
    console.error('Supabase insert error:', err);
    // Continue to respond even if logging fails.
  }

  const responsePayload: ChatSuccessResponse | ChatVetoResponse = {
    session_id: sessId,
    response: halResult.hal_verdict === 'VETOED' ? null : llmResult.llm_response,
    llm_provider_used: llmResult.llm_provider_used,
    prompt_count_today: promptCountToday,
    prompts_remaining_today: promptsRemainingToday,
    hal: {
      score: halResult.hal_score,
      signals: halResult.hal_signals,
      verdict: halResult.hal_verdict,
      flagged_hallucination: halResult.hal_flagged_hallucination,
    },
    token_stats: {
      used: halResult.tokens_used,
      baseline_estimate: null,
      savings_pct: null,
    },
    latency_ms: latency,
    score_event_id: halResult.score_event_id,
  };

  if (halResult.hal_verdict === 'VETOED') {
    (responsePayload as ChatVetoResponse).veto_reason = 'HAL veto triggered';
    (responsePayload as ChatVetoResponse).suggested_rephrase = null;
    return res.json(responsePayload);
  }

  return res.json(responsePayload);
}
