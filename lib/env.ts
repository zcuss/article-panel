// Read/write .env from disk so dashboard edits take effect without restart.
// process.env is only used as a fallback for first boot.

import fs from 'node:fs';
import path from 'node:path';

const ENV_PATH = process.env.ENV_FILE_PATH || path.join(process.cwd(), '.env');

// Allowlist of editable keys. Anything else in .env is preserved.
export const EDITABLE_KEYS = [
  'ADMIN_PASSWORD',
  'AI_BASE_URL',
  'AI_API_KEY',
  'AI_MODEL',
  'AI_EXTRA_HEADER',
  'SITES_DIR',
  'NGINX_SITES_DIR',
  'NGINX_INCLUDE_PATH',
  'NGINX_RELOAD_CMD',
] as const;

export type EditableKey = (typeof EDITABLE_KEYS)[number];

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    // strip surrounding quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function serializeEnv(values: Record<string, string>, original: string): string {
  // Preserve original line order, comments, and untouched keys.
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const raw of original.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line) { lines.push(line); continue; }
    if (line.startsWith('#')) { lines.push(line); continue; }
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (m) {
      const k = m[1];
      seen.add(k);
      if (k in values) lines.push(`${k}=${formatVal(values[k])}`);
      else lines.push(line);
    } else {
      lines.push(line);
    }
  }
  // Append any new editable keys not in original
  for (const k of EDITABLE_KEYS) {
    if (!seen.has(k) && k in values) {
      lines.push(`${k}=${formatVal(values[k])}`);
    }
  }
  return lines.join('\n') + (lines.length && !lines[lines.length - 1] ? '' : '\n');
}

function formatVal(v: string): string {
  if (v === '') return '';
  if (/[\s#"'\\$`]/.test(v)) return JSON.stringify(v);
  return v;
}

export function readEnv(): Record<string, string> {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    return parseEnv(content);
  } catch {
    return { ...process.env } as Record<string, string>;
  }
}

export function writeEnv(updates: Partial<Record<EditableKey, string>>): Record<string, string> {
  let original = '';
  try { original = fs.readFileSync(ENV_PATH, 'utf8'); } catch { /* new file */ }
  const current = parseEnv(original);
  const merged = { ...current };
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue;
    merged[k] = v;
  }
  fs.mkdirSync(path.dirname(ENV_PATH), { recursive: true });
  fs.writeFileSync(ENV_PATH, serializeEnv(merged, original), { mode: 0o600 });
  return merged;
}

export function get(key: EditableKey, fallback = ''): string {
  const fromDisk = readEnv()[key];
  if (fromDisk !== undefined && fromDisk !== '') return fromDisk;
  return process.env[key] || fallback;
}
