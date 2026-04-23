"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callLitellm = callLitellm;
const config_1 = require("../config");
const ATTEMPT_TIMEOUT_MS = 15000;
async function fetchWithTimeout(url, init, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
        return await fetch(url, { ...init, signal: ctrl.signal });
    }
    finally {
        clearTimeout(timer);
    }
}
async function callWithRetry(label, doCall) {
    let res = await doCall();
    if (res.status >= 500) {
        res = await doCall();
    }
    if (res.status === 429) {
        throw new Error(`${label} 429 rate limit`);
    }
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${label} ${res.status}: ${body.slice(0, 200)}`);
    }
    return res;
}
async function tryAnthropic(message, model) {
    if (!config_1.CONFIG.ANTHROPIC_API_KEY)
        throw new Error('ANTHROPIC_API_KEY not set');
    const res = await callWithRetry('anthropic-direct', () => fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': config_1.CONFIG.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model,
            max_tokens: 800,
            messages: [{ role: 'user', content: message }],
        }),
    }, ATTEMPT_TIMEOUT_MS));
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (typeof text !== 'string')
        throw new Error('Anthropic response missing content[0].text');
    const inTok = data?.usage?.input_tokens ?? 0;
    const outTok = data?.usage?.output_tokens ?? 0;
    const total = inTok + outTok;
    return { response_text: text, llm_provider_used: 'anthropic-direct', tokens_used: total || null };
}
async function tryOpenAIFormat(opts) {
    if (!opts.key)
        throw new Error(`${opts.label} key not set`);
    const res = await callWithRetry(opts.label, () => fetchWithTimeout(opts.url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${opts.key}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: opts.model,
            messages: [{ role: 'user', content: opts.message }],
            max_tokens: 800,
        }),
    }, ATTEMPT_TIMEOUT_MS));
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
        throw new Error(`${opts.label} response missing choices[0].message.content`);
    }
    const tokens = typeof data?.usage?.total_tokens === 'number' ? data.usage.total_tokens : null;
    return { response_text: text, llm_provider_used: opts.label, tokens_used: tokens };
}
function tryOpenRouter(message, model, label) {
    return tryOpenAIFormat({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: config_1.CONFIG.OPENROUTER_API_KEY,
        model,
        message,
        label,
    });
}
function tryGroq(message) {
    return tryOpenAIFormat({
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: config_1.CONFIG.GROQ_API_KEY,
        model: 'llama-3.3-70b-versatile',
        message,
        label: 'groq-llama',
    });
}
function tryOpenAI(message) {
    return tryOpenAIFormat({
        url: 'https://api.openai.com/v1/chat/completions',
        key: config_1.CONFIG.OPENAI_API_KEY,
        model: 'gpt-4o',
        message,
        label: 'openai-direct',
    });
}
async function tryGemini(message) {
    if (!config_1.CONFIG.GEMINI_API_KEY)
        throw new Error('GEMINI_API_KEY not set');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${encodeURIComponent(config_1.CONFIG.GEMINI_API_KEY)}`;
    const res = await callWithRetry('gemini-direct', () => fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            generationConfig: { maxOutputTokens: 800 },
        }),
    }, ATTEMPT_TIMEOUT_MS));
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
        throw new Error('Gemini response missing candidates[0].content.parts[0].text');
    }
    const inTok = data?.usageMetadata?.promptTokenCount ?? 0;
    const outTok = data?.usageMetadata?.candidatesTokenCount ?? 0;
    const total = inTok + outTok;
    return { response_text: text, llm_provider_used: 'gemini-direct', tokens_used: total || null };
}
function buildChain(message, model_preference) {
    const pref = (model_preference || '').toLowerCase();
    const groq = { name: 'groq-llama', fn: () => tryGroq(message) };
    if (pref.startsWith('claude')) {
        return [
            { name: 'anthropic-direct', fn: () => tryAnthropic(message, 'claude-sonnet-4-6') },
            { name: 'openrouter-claude', fn: () => tryOpenRouter(message, 'anthropic/claude-sonnet-4.6', 'openrouter-claude') },
            groq,
        ];
    }
    if (pref.startsWith('gpt')) {
        return [
            { name: 'openai-direct', fn: () => tryOpenAI(message) },
            { name: 'openrouter-gpt', fn: () => tryOpenRouter(message, 'openai/gpt-4o', 'openrouter-gpt') },
            groq,
        ];
    }
    if (pref.startsWith('gemini')) {
        return [
            { name: 'gemini-direct', fn: () => tryGemini(message) },
            { name: 'openrouter-gemini', fn: () => tryOpenRouter(message, 'google/gemini-pro-1.5', 'openrouter-gemini') },
            groq,
        ];
    }
    return [
        { name: 'anthropic-direct', fn: () => tryAnthropic(message, 'claude-sonnet-4-6') },
        { name: 'openrouter-claude', fn: () => tryOpenRouter(message, 'anthropic/claude-sonnet-4.6', 'openrouter-claude') },
        groq,
    ];
}
async function callLitellm(message, model_preference) {
    const chain = buildChain(message, model_preference);
    const tried = [];
    for (const step of chain) {
        tried.push(step.name);
        try {
            const result = await step.fn();
            console.log(`[llm] ${step.name} served request (tokens: ${result.tokens_used ?? 'n/a'})`);
            return result;
        }
        catch (err) {
            console.warn(`[llm] ${step.name} failed: ${err?.message || err}`);
        }
    }
    throw new Error(`All LLM providers unavailable — tried: [${tried.join(', ')}]`);
}
