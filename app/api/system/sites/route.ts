import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sudo, isRoot } from '@/lib/sh';
import fs from 'node:fs';

export const dynamic = 'force-dynamic';

const SITES_DIR = process.env.SITES_DIR || '/var/www/sites';
const NGINX_DIR = process.env.NGINX_SITES_DIR || '/etc/nginx/sites-enabled';

async function listDir(dir: string, requireSudo: boolean): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(dir);
    return entries.filter(n => !n.startsWith('.'));
  } catch {
    if (requireSudo && !isRoot()) {
      const r = await sudo('ls', ['-1', dir]);
      return r.stdout ? r.stdout.split('\n').filter(Boolean) : [];
    }
    return [];
  }
}

export async function GET() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const [sites, confs] = await Promise.all([
    listDir(SITES_DIR, true),
    listDir(NGINX_DIR, true),
  ]);
  return NextResponse.json({ sites_dir: SITES_DIR, nginx_dir: NGINX_DIR, sites, confs });
}