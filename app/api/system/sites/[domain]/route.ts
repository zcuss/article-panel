import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sudo } from '@/lib/sh';

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
  const tmpl = TEMPLATE(domain, root);

  const write = await sudo('bash', ['-c', `mkdir -p '${root}/${domain}' && cat > '${nginxDir}/${domain}.conf' <<'NGX'
${tmpl}
NGX
nginx -t && nginx -s reload`]);
  if (write.code !== 0) return NextResponse.json({ ok: false, stderr: write.stderr }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { domain: string } }) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const domain = params.domain;
  if (!/^[a-z0-9.-]+$/i.test(domain)) return NextResponse.json({ ok: false, error: 'invalid domain' }, { status: 400 });

  const nginxDir = process.env.NGINX_SITES_DIR || '/etc/nginx/sites-enabled';
  const root = process.env.SITES_DIR || '/var/www/sites';
  const r = await sudo('bash', ['-c', `rm -f '${nginxDir}/${domain}.conf' && rm -rf '${root}/${domain}' && nginx -t && nginx -s reload`]);
  if (r.code !== 0) return NextResponse.json({ ok: false, stderr: r.stderr }, { status: 500 });
  return NextResponse.json({ ok: true });
}