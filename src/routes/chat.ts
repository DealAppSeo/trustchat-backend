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

export default async function chatHandler(req: Request, res: Response) {
  const {
    message,
    session_id,
    model_preference,
    byok_provider,
  } = req.body as ChatRequest;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required and must be a non‑empty string.' } as ChatErrorResponse);
  }
  if (message.length > 4000) {
    return res.status(400).json({ error: 'Message exceeds maximum length of 4000 characters.' } as ChatErrorResponse);
  }

  const sessId = session_id || uuidv4();
  const start = Date.now();

  let llmResult;
  try {
    llmResult = await callLitellm(message, model_preference);
  } catch (err) {
    console.error('Litellm error:', err);
    return res.status(504).json({ error: 'LLM service failed.' } as ChatErrorResponse);
  }

  let halResult;
  try {
    halResult = await scoreWithHal(message, llmResult.response_text, llmResult.tokens_used);
  } catch (err) {
    console.error('HAL (Hallucination Assessment Layer) scoring error:', err);
    const latency = Date.now() - start;
    await supabaseClient.from('trustchat_sessions').insert({
      session_id: sessId,
      session_date: new Date().toISOString().split('T')[0],
      prompt_count_in_session: 1,
      user_message: message,
      llm_provider_used: llmResult.llm_provider_used,
      llm_model: llmResult.llm_provider_used,
      llm_response: llmResult.response_text,
      tokens_used: llmResult.tokens_used,
      latency_ms: latency,
    });
    return res.json({
      session_id: sessId,
      response: llmResult.response_text,
      llm_provider_used: llmResult.llm_provider_used,
      prompt_count_today: 1,
      prompts_remaining_today: 9,
      hal: null,
      token_stats: { used: llmResult.tokens_used, baseline_estimate: null, savings_pct: null },
      latency_ms: latency,
    } as any);
  }

  const latency = Date.now() - start;

  const promptCountToday = 1;
  const promptsRemainingToday = 9;

  try {
    await supabaseClient.from('trustchat_sessions').insert({
      session_id: sessId,
      session_date: new Date().toISOString().split('T')[0],
      prompt_count_in_session: promptCountToday,
      user_ip_hash: null,
      user_message: message,
      byok_provider: byok_provider || null,
      llm_provider_used: llmResult.llm_provider_used,
      llm_model: llmResult.llm_provider_used,
      llm_response: llmResult.response_text,
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
  }

  const hal = {
    score: halResult.hal_score,
    signals: halResult.hal_signals,
    verdict: halResult.hal_verdict,
    flagged_hallucination: halResult.hal_flagged_hallucination,
  };
  const token_stats = {
    used: halResult.tokens_used,
    baseline_estimate: null,
    savings_pct: null,
  };

  if (halResult.hal_verdict === 'VETOED') {
    const vetoPayload: ChatVetoResponse = {
      session_id: sessId,
      response: null,
      llm_provider_used: llmResult.llm_provider_used,
      prompt_count_today: promptCountToday,
      prompts_remaining_today: promptsRemainingToday,
      hal,
      token_stats,
      latency_ms: latency,
      score_event_id: halResult.score_event_id,
      veto_reason: 'HAL veto triggered',
      suggested_rephrase: null,
    };
    return res.json(vetoPayload);
  }

  const successPayload: ChatSuccessResponse = {
    session_id: sessId,
    response: llmResult.response_text,
    llm_provider_used: llmResult.llm_provider_used,
    prompt_count_today: promptCountToday,
    prompts_remaining_today: promptsRemainingToday,
    hal,
    token_stats,
    latency_ms: latency,
    score_event_id: halResult.score_event_id,
  };
  return res.json(successPayload);
}
