function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function extractCertainty(answer: string): number {
  const a = answer.toLowerCase();
  let certainty = 0.6;
  if (/\b(definitely|always|never|absolutely|certainly|exactly)\b/.test(a)) certainty += 0.3;
  if (/\b(might|may|possibly|perhaps|likely)\b/.test(a)) certainty -= 0.2;
  return clamp01(certainty);
}

function heuristicScore(question: string, answer: string, tokensUsed: number | null) {
  const q = question.toLowerCase();
  const a = answer.toLowerCase();
  const qa = `${q} ${a}`;

  let evidence = 0.4;
  const hasNumOrDate = /\d/.test(answer);
  const hasProperNouns = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/.test(answer);
  if (hasNumOrDate || hasProperNouns) evidence += 0.3;
  if (/\b(according to|study|research|data)\b/.test(a)) evidence += 0.2;
  evidence = clamp01(evidence);

  const certainty = extractCertainty(answer);

  let uncertainty = 0.3;
  if (/\b(why|predict|will|future|opinion)\b/.test(q)) uncertainty += 0.3;
  uncertainty = clamp01(uncertainty);

  let harm = 0.1;
  if (/\b(medical|legal|financial advice|weapon|weapons|drug|drugs|self[-\s]harm|suicide)\b/.test(qa)) {
    harm += 0.3;
  }
  harm = clamp01(harm);

  let scope = 0.8;
  if (/as an ai\b/.test(a)) scope -= 0.3;
  if (answer.length < 20) scope -= 0.2;
  scope = clamp01(scope);

  const hal_score = clamp01(
    harm * 0.4 + (1 - evidence) * 0.3 + uncertainty * 0.2 + (1 - scope) * 0.1,
  );

  return {
    hal_score,
    signals: {
      evidence_quality: evidence,
      certainty_at_claim: certainty,
      epistemic_uncertainty: uncertainty,
      harm_probability: harm,
      scope_appropriateness: scope,
    },
    tokens_used: tokensUsed,
  };
}

function buildResponse(
  hal_score: number,
  signals: {
    evidence_quality: number;
    certainty_at_claim: number;
    epistemic_uncertainty: number;
    harm_probability: number;
    scope_appropriateness: number;
  },
  tokensUsed: number | null,
) {
  const score = clamp01(hal_score);
  const hal_verdict: 'APPROVED' | 'FLAGGED' | 'VETOED' =
    score > 0.6 ? 'VETOED' : score > 0.4 ? 'FLAGGED' : 'APPROVED';
  const hal_flagged_hallucination = score > 0.5;

  return {
    hal_score: Number(score.toFixed(4)),
    hal_signals: {
      evidence_quality: Number(signals.evidence_quality.toFixed(4)),
      certainty_at_claim: Number(signals.certainty_at_claim.toFixed(4)),
      epistemic_uncertainty: Number(signals.epistemic_uncertainty.toFixed(4)),
      harm_probability: Number(signals.harm_probability.toFixed(4)),
      scope_appropriateness: Number(signals.scope_appropriateness.toFixed(4)),
    },
    hal_verdict,
    hal_flagged_hallucination,
    tokens_used: tokensUsed,
    score_event_id: null as number | null,
  };
}

async function callRepidEngine(
  answer: string,
  certainty: number,
): Promise<{
  hal_score: number;
  signals: {
    evidence_quality: number;
    certainty_at_claim: number;
    epistemic_uncertainty: number;
    harm_probability: number;
    scope_appropriateness: number;
  };
} | null> {
  const url = process.env.REPID_ENGINE_URL;
  const apiKey = process.env.REPID_ENGINE_API_KEY;
  if (!url || !apiKey) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${url}/api/v1/hal/signals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ text: answer, domain: 'general', certainty }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn(`[hal] repid-engine ${res.status}; falling back to heuristic`);
      return null;
    }
    const json: any = await res.json();
    const s = json?.signals;
    if (
      !s ||
      typeof json.hal_score !== 'number' ||
      typeof s.harm_probability !== 'number' ||
      typeof s.epistemic_uncertainty !== 'number' ||
      typeof s.evidence_quality !== 'number' ||
      typeof s.scope_appropriateness !== 'number' ||
      typeof s.certainty_at_claim !== 'number'
    ) {
      console.warn('[hal] repid-engine returned malformed payload; falling back to heuristic');
      return null;
    }
    return {
      hal_score: json.hal_score,
      signals: {
        evidence_quality: s.evidence_quality,
        certainty_at_claim: s.certainty_at_claim,
        epistemic_uncertainty: s.epistemic_uncertainty,
        harm_probability: s.harm_probability,
        scope_appropriateness: s.scope_appropriateness,
      },
    };
  } catch (err: any) {
    console.warn(`[hal] repid-engine call failed (${err?.message || err}); falling back to heuristic`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function scoreWithHal(
  question: string,
  answer: string,
  tokensUsed: number | null,
) {
  const certainty = extractCertainty(answer);
  const remote = await callRepidEngine(answer, certainty);
  if (remote) {
    return buildResponse(remote.hal_score, remote.signals, tokensUsed);
  }
  const local = heuristicScore(question, answer, tokensUsed);
  return buildResponse(local.hal_score, local.signals, tokensUsed);
}
