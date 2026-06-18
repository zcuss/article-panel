import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sudo } from '@/lib/sh';
import fs from 'node:fs';

const TEMPLATE = (domain: string, root: string) => `server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    root ${root}/${domain};
    index index.html;
    charset utf-8;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    location ~ /\\. { deny all; }
    location / { try_files $uri $uri/ /index.html; }
}
`;

export async function POST(_req: Request, { params }: { params: { domain: string } }) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const domain = params.domain;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return NextResponse.json({ ok: false, error: 'invalid domain' }, { status: 400 });

  const root = process.env.SITES_DIR || '/var/www/sites';
  const nginxDir = process.env.NGINX_SITES_DIR || '/etc/nginx/sites-enabled';
  const confFile = `${nginxDir}/${domain}.conf`;
  const siteDir = `${root}/${domain}`;

  const mk = await sudo('mkdir', ['-p', siteDir]);
  if (mk.code !== 0) return NextResponse.json({ ok: false, error: 'mkdir failed', stderr: mk.stderr }, { status: 500 });

  const tmp = `/tmp/ap-${domain}.conf`;
  fs.writeFileSync(tmp, TEMPLATE(domain, root));
  const cp = await sudo('cp', [tmp, confFile]);
  try { fs.unlinkSync(tmp); } catch {}
  if (cp.code !== 0) return NextResponse.json({ ok: false, error: 'cp failed', stderr: cp.stderr }, { status: 500 });

  const test = await sudo('nginx', ['-t']);
  if (test.code !== 0) return NextResponse.json({ ok: false, error: 'nginx -t failed', stderr: test.stderr }, { status: 500 });
  const reload = await sudo('nginx', ['-s', 'reload']);
  if (reload.code !== 0) return NextResponse.json({ ok: false, error: 'reload failed', stderr: reload.stderr }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { domain: string } }) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const domain = params.domain;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return NextResponse.json({ ok: false, error: 'invalid domain' }, { status: 400 });

  const nginxDir = process.env.NGINX_SITES_DIR || '/etc/nginx/sites-enabled';
  const root = process.env.SITES_DIR || '/var/www/sites';
  const confFile = `${nginxDir}/${domain}.conf`;
  const siteDir = `${root}/${domain}`;

  const rmConf = await sudo('rm', ['-f', confFile]);
  if (rmConf.code !== 0) return NextResponse.json({ ok: false, error: 'rm conf failed', stderr: rmConf.stderr }, { status: 500 });

  const rmSite = await sudo('rm', ['-rf', siteDir]);
  if (rmSite.code !== 0) return NextResponse.json({ ok: false, error: 'rm site failed', stderr: rmSite.stderr }, { status: 500 });

  const test = await sudo('nginx', ['-t']);
  if (test.code !== 0) return NextResponse.json({ ok: false, error: 'nginx -t failed', stderr: test.stderr }, { status: 500 });
  const reload = await sudo('nginx', ['-s', 'reload']);
  if (reload.code !== 0) return NextResponse.json({ ok: false, error: 'reload failed', stderr: reload.stderr }, { status: 500 });

  return NextResponse.json({ ok: true });
}