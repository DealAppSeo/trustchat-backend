"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = healthHandler;
const supabase_1 = require("../services/supabase");
async function healthHandler(_req, res) {
    try {
        // Simple ping: head select on trustchat_sessions (no rows needed)
        await supabase_1.supabaseClient.from('trustchat_sessions').select('id', { count: 'exact', head: true });
        res.status(200).json({ status: 'ok', supabase: 'connected', uptime_seconds: Math.floor(process.uptime()) });
    }
    catch (err) {
        console.error('Health check error:', err);
        res.status(503).json({ status: 'degraded', supabase: 'error', uptime_seconds: Math.floor(process.uptime()) });
    }
}
