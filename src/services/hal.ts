import fetch from 'node-fetch';
import { CONFIG } from '../config';
/**
 * Mock HAL scoring service wrapper.
 * In production this would POST to the RepID Engine `/score-event` endpoint.
 * The mock generates deterministic signals based on the decision text length.
 * It also returns a flagged hallucination boolean when the simulated
 * `harm_probability` exceeds a small threshold.
 */
export async function scoreWithHal(decisionText: string, sessionId: string) {
  const length = decisionText.length;
  const base = (length % 100) / 100; // 0.0‑0.99
  const halScore = Number((base * 0.5 + 0.5).toFixed(4)); // 0.5‑1.0
  const signals = {
    harm_probability: Number((base * 0.2).toFixed(4)),
    epistemic_uncertainty: Number(((1 - base) * 0.5).toFixed(4)),
    evidence_quality: Number((base * 0.8).toFixed(4)),
    scope_appropriateness: Number(((base + 0.3) % 1).toFixed(4)),
    certainty_at_claim: Number((base * 0.9 + 0.1).toFixed(4)),
  };
  const verdict = halScore > 0.75 ? 'APPROVED' : halScore > 0.5 ? 'FLAGGED' : 'VETOED';
  const flaggedHallucination = signals.harm_probability > 0.1;
  const tokensUsed = Math.floor(50 + base * 150); // mock token count

  // Simulate async latency.
  await new Promise(r => setTimeout(r, 50));

  return {
    hal_score: halScore,
    hal_signals: signals,
    hal_verdict: verdict,
    hal_flagged_hallucination: flaggedHallucination,
    tokens_used: tokensUsed,
    // mock score_event_id – random bigint in a plausible range
    score_event_id: Math.floor(Math.random() * 1000) + 400,
  };
}
