import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('tc_catches')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error("api/wall error", error);
      return NextResponse.json([]);
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
