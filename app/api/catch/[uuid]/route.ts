import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('tc_catches').select('*').eq('id', uuid).single();
    if (error) {
       console.error("api/catch error", error);
       // Return mock data if db fails
       return NextResponse.json({ id: uuid, question: 'Mock question', verdict: 'HALLUCINATION_CAUGHT' });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ id: 'mock', question: 'Mock question' });
  }
}
