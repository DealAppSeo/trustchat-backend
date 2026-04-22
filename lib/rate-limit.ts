export function checkRateLimit(session: { question_count: number; email?: string | null }) {
  const count = session?.question_count || 0;
  const hasEmail = !!session?.email;
  
  if (count >= 13) return { status: 429, message: 'Rate limit exceeded' };
  if (count >= 3 && !hasEmail) return { status: 402, message: 'Email required' };
  
  return { status: 200, message: 'OK' };
}
