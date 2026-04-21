import { Request, Response } from 'express';
import { supabaseClient } from '../services/supabase';

export default async function healthHandler(_req: Request, res: Response) {
  try {
    // Simple ping: head select on trustchat_sessions (no rows needed)
    await supabaseClient.from('trustchat_sessions').select('id', { count: 'exact', head: true });
    res.status(200).json({ status: 'ok', supabase: 'connected', uptime_seconds: Math.floor(process.uptime()) });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(503).json({ status: 'degraded', supabase: 'error', uptime_seconds: Math.floor(process.uptime()) });
  }
}
