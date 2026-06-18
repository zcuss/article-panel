import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = 'ap_session';
const ALG = 'HS256';

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET || 'dev-secret-change-me-please-32chars';
  return new TextEncoder().encode(s);
}

export async function signSession(payload: { sub: string; role: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as { sub: string; role: string; iat: number; exp: number };
}

export async function getSession() {
  const c = await cookies();
  const tok = c.get(COOKIE)?.value;
  if (!tok) return null;
  try { return await verifySession(tok); } catch { return null; }
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== 'admin') throw new Response('Unauthorized', { status: 401 });
  return s;
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD || 'changeme';
  if (input.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
