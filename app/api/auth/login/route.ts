import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, signSession, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== 'string') return NextResponse.json({ error: 'password required' }, { status: 400 });
  if (!(await checkPassword(password))) return NextResponse.json({ error: 'wrong password' }, { status: 401 });
  const token = await signSession({ sub: 'admin', role: 'admin' });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
