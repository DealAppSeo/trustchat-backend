import { Request, Response } from 'express';
import { supabaseClient } from '../services/supabase';

export default async function wallHandler(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 20;
  const cursor = req.query.cursor as string;

  try {
    let query = supabaseClient
      .from('trustchat_sessions')
      .select('*')
      .in('hal_verdict', ['HALLUCINATION_CAUGHT', 'VETOED', 'FLAGGED', 'FLAGGED_UNCERTAIN'])
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase /wall error:', error);
      return res.status(500).json({ error: 'Failed to fetch wall data' });
    }

    const hasMore = data.length > limit;
    const catches = hasMore ? data.slice(0, limit) : data;
    const nextCursor = catches.length > 0 ? catches[catches.length - 1].created_at : null;

    return res.json({
      catches,
      has_more: hasMore,
      next_cursor: nextCursor,
      total: 0 // Cannot get fast total with cursor pagination
    });
  } catch (err) {
    console.error('Wall error:', err);
    return res.status(500).json({ error: 'Failed to fetch wall data' });
  }
}
