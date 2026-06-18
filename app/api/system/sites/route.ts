import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sudo } from '@/lib/sh';

export const dynamic = 'force-dynamic';

const SITES_DIR = process.env.SITES_DIR || '/var/www/sites';
const NGINX_DIR = process.env.NGINX_SITES_DIR || '/etc/nginx/sites-enabled';

export async function GET() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const list = await sudo('bash', ['-c', `ls -1 ${SITES_DIR} 2>/dev/null; echo ---; ls -1 ${NGINX_DIR} 2>/dev/null`]);
  const [sitesBlock, confBlock] = list.stdout.split('---');
  const sites = sitesBlock.trim().split('\n').filter(Boolean);
  const confs = confBlock.trim().split('\n').filter(Boolean);
  return NextResponse.json({ sites_dir: SITES_DIR, nginx_dir: NGINX_DIR, sites, confs });
}