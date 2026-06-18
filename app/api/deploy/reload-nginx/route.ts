import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, type Article } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { writeNginxConfig, getNginxIncludeDirective } from '@/lib/nginx';
import { writeArticleToDisk } from '@/lib/build';

function run(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    const p = spawn(cmd, args, { env: process.env });
    let stdout = '', stderr = '';
    p.stdout.on('data', d => stdout += d.toString());
    p.stderr.on('data', d => stderr += d.toString());
    p.on('close', code => resolve({ code: code ?? -1, stdout, stderr }));
    p.on('error', e => resolve({ code: -1, stdout, stderr: e.message }));
  });
}

export async function POST() {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const db = getDb();
  const articles = db.prepare("SELECT * FROM articles WHERE status='published'").all() as Article[];

  // 1. ensure all HTML is on disk
  for (const a of articles) writeArticleToDisk(a);

  // 2. write nginx configs
  const { combinedPath } = writeNginxConfig(articles);

  // 3. symlink combined file to include path (if env says so)
  const includePath = getNginxIncludeDirective();
  const log: string[] = [];
  let symlinked = false;
  if (includePath && includePath.startsWith('/')) {
    try {
      fs.mkdirSync(path.dirname(includePath), { recursive: true });
      try { fs.unlinkSync(includePath); } catch {}
      fs.symlinkSync(path.resolve(combinedPath), includePath);
      log.push(`symlinked ${includePath} -> ${combinedPath}`);
      symlinked = true;
    } catch (e: any) {
      log.push(`symlink failed: ${e.message}`);
    }
  } else {
    log.push(`skipped symlink (NGINX_INCLUDE_PATH not absolute: ${includePath})`);
  }

  // 4. reload nginx
  const reloadCmd = process.env.NGINX_RELOAD_CMD || 'sudo /usr/sbin/nginx -s reload';
  const parts = reloadCmd.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  const r = await run(cmd, args);
  log.push(`$ ${reloadCmd}`);
  log.push(r.stdout || '');
  if (r.stderr) log.push('STDERR: ' + r.stderr);
  if (r.code !== 0) {
    return NextResponse.json({ ok: false, error: 'nginx reload failed', log, symlinked, code: r.code }, { status: 500 });
  }
  return NextResponse.json({ ok: true, symlinked, domains: articles.length, log });
}
