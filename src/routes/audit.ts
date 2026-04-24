import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { scoreWithHal } from '../services/hal';
import { supabaseClient } from '../services/supabase';

export default async function auditHandler(req: Request, res: Response) {
  const { user_prompt, llm_response, llm_provider } = req.body;

  if (!user_prompt || typeof user_prompt !== 'string' || user_prompt.trim().length === 0 || user_prompt.length > 4000) {
    return res.status(400).json({ error: 'user_prompt is required and must be a valid string up to 4000 characters.' });
  }
  if (!llm_response || typeof llm_response !== 'string' || llm_response.trim().length === 0 || llm_response.length > 8000) {
    return res.status(400).json({ error: 'llm_response is required and must be a valid string up to 8000 characters.' });
  }
  if (!['claude', 'openai', 'gemini'].includes(llm_provider)) {
    return res.status(400).json({ error: 'llm_provider is required and must be one of: claude, openai, gemini' });
  }

  const sessId = uuidv4();
  const start = Date.now();

  let halResult;
  try {
    halResult = await scoreWithHal(user_prompt, llm_response, null);
  } catch (err) {
    console.error('HAL (Hallucination Assessment Layer) scoring error:', err);
    return res.status(500).json({ error: 'HAL scoring failed.' });
  }

  const latency = Date.now() - start;

  // Map verdict
  let verdict: 'TRUTH_VERIFIED' | 'FLAGGED_UNCERTAIN' | 'HALLUCINATION_CAUGHT';
  if (halResult.hal_verdict === 'APPROVED') {
    verdict = 'TRUTH_VERIFIED';
  } else if (halResult.hal_verdict === 'FLAGGED') {
    verdict = 'FLAGGED_UNCERTAIN';
  } else {
    verdict = 'HALLUCINATION_CAUGHT';
  }

  try {
    await supabaseClient.from('trustchat_sessions').insert({
      session_id: sessId,
      session_date: new Date().toISOString().split('T')[0],
      prompt_count_in_session: 1,
      user_ip_hash: null,
      user_message: user_prompt,
      llm_provider_used: llm_provider,
      llm_model: llm_provider,
      llm_response: llm_response,
      hal_score: halResult.hal_score,
      hal_signals: halResult.hal_signals,
      hal_verdict: verdict,
      hal_flagged_hallucination: halResult.hal_flagged_hallucination,
      example_data: false,
      latency_ms: latency,
    });
  } catch (err) {
    console.error('Supabase insert error:', err);
  }

  return res.json({
    session_id: sessId,
    hal_signals: halResult.hal_signals,
    hal_score: halResult.hal_score,
    hal_verdict: verdict,
    latency_ms: latency
  });
}
