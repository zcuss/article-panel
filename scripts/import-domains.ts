// Bulk import from available.txt. One article per domain, status=draft, body kosong.
// Use AI tab di UI untuk generate per article.
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] || path.join(process.cwd(), '..', 'checker', 'available.txt');
if (!fs.existsSync(file)) { console.error('not found:', file); process.exit(1); }

const domains = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
console.log('Importing', domains.length, 'domains…');

// Dynamic import to ensure tsx runs ESM
import('../lib/db').then(({ getDb }) => {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO articles (domain, title, header, lang, status, created_at, updated_at)
    VALUES (?, ?, ?, 'id', 'draft', ?, ?)
  `);
  const tx = db.transaction((items: string[]) => {
    for (const d of items) {
      const name = d.split('.')[0];
      const title = name.toUpperCase();
      const header = `Artikel lengkap tentang ${name}.`;
      insert.run(d, title, header, now, now);
    }
  });
  tx(domains);
  const total = (db.prepare('SELECT COUNT(*) AS c FROM articles').get() as { c: number }).c;
  console.log('Done. Total articles in DB:', total);
});
