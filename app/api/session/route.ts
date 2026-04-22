import { NextResponse } from 'next/server';
import { getOrCreateSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = await getOrCreateSession(body.session_id);
    return NextResponse.json(session);
  } catch (error) {
    console.error("api/session error", error);
    // Return dummy when db is not running
    return NextResponse.json({ id: 'dummy-uuid', question_count: 0 });
  }
}
