"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = auditHandler;
const uuid_1 = require("uuid");
const hal_1 = require("../services/hal");
const supabase_1 = require("../services/supabase");
async function auditHandler(req, res) {
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
    const sessId = (0, uuid_1.v4)();
    const start = Date.now();
    let halResult;
    try {
        halResult = await (0, hal_1.scoreWithHal)(user_prompt, llm_response, null);
    }
    catch (err) {
        console.error('HAL scoring error:', err);
        return res.status(500).json({ error: 'HAL scoring failed.' });
    }
    const latency = Date.now() - start;
    // Map verdict
    let verdict;
    if (halResult.hal_verdict === 'APPROVED') {
        verdict = 'TRUTH_VERIFIED';
    }
    else if (halResult.hal_verdict === 'FLAGGED') {
        verdict = 'FLAGGED_UNCERTAIN';
    }
    else {
        verdict = 'HALLUCINATION_CAUGHT';
    }
    try {
        await supabase_1.supabaseClient.from('trustchat_sessions').insert({
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
    }
    catch (err) {
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
