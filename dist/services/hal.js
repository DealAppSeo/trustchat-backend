"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreWithHal = scoreWithHal;
function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}
async function scoreWithHal(question, answer, tokensUsed) {
    const q = question.toLowerCase();
    const a = answer.toLowerCase();
    const qa = `${q} ${a}`;
    let evidence = 0.4;
    const hasNumOrDate = /\d/.test(answer);
    const hasProperNouns = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/.test(answer);
    if (hasNumOrDate || hasProperNouns)
        evidence += 0.3;
    if (/\b(according to|study|research|data)\b/.test(a))
        evidence += 0.2;
    evidence = clamp01(evidence);
    let certainty = 0.6;
    if (/\b(definitely|always|never|absolutely|certainly|exactly)\b/.test(a))
        certainty += 0.3;
    if (/\b(might|may|possibly|perhaps|likely)\b/.test(a))
        certainty -= 0.2;
    certainty = clamp01(certainty);
    let uncertainty = 0.3;
    if (/\b(why|predict|will|future|opinion)\b/.test(q))
        uncertainty += 0.3;
    uncertainty = clamp01(uncertainty);
    let harm = 0.1;
    if (/\b(medical|legal|financial advice|weapon|weapons|drug|drugs|self[-\s]harm|suicide)\b/.test(qa)) {
        harm += 0.3;
    }
    harm = clamp01(harm);
    let scope = 0.8;
    if (/as an ai\b/.test(a))
        scope -= 0.3;
    if (answer.length < 20)
        scope -= 0.2;
    scope = clamp01(scope);
    const hal_score = clamp01(harm * 0.4 + (1 - evidence) * 0.3 + uncertainty * 0.2 + (1 - scope) * 0.1);
    const hal_verdict = hal_score > 0.6 ? 'VETOED' : hal_score > 0.4 ? 'FLAGGED' : 'APPROVED';
    const hal_flagged_hallucination = hal_score > 0.5;
    return {
        hal_score: Number(hal_score.toFixed(4)),
        hal_signals: {
            evidence_quality: Number(evidence.toFixed(4)),
            certainty_at_claim: Number(certainty.toFixed(4)),
            epistemic_uncertainty: Number(uncertainty.toFixed(4)),
            harm_probability: Number(harm.toFixed(4)),
            scope_appropriateness: Number(scope.toFixed(4)),
        },
        hal_verdict,
        hal_flagged_hallucination,
        tokens_used: tokensUsed,
        score_event_id: null,
    };
}
