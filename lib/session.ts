import { getSupabaseServer } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function getOrCreateSession(clientId?: string | null) {
  const supabase = getSupabaseServer();
  let sessionId = clientId;
  
  if (sessionId) {
    const { data } = await supabase.from('tc_sessions').select('*').eq('id', sessionId).single();
    if (data) return data;
  }
  
  sessionId = sessionId || uuidv4();
  const { data, error } = await supabase.from('tc_sessions').insert([{ id: sessionId }]).select().single();
  
  if (error) {
    console.error("Session creation error:", error);
    // Return a dummy session if DB is not ready (for local testing until env vars provided)
    return { id: sessionId, question_count: 0, email: null, session_repid: 0 };
  }
  return data;
}

export async function incrementQuestionCount(sessionId: string) {
  const supabase = getSupabaseServer();
  // Fetch current
  const { data } = await supabase.from('tc_sessions').select('question_count').eq('id', sessionId).single();
  const count = (data?.question_count || 0) + 1;
  await supabase.from('tc_sessions').update({ 
    question_count: count, 
    last_active_at: new Date().toISOString() 
  }).eq('id', sessionId);
  return count;
}
