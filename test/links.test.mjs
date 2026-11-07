// Kontrola sestaveného webu: interní odkazy, title/description, H1, rozměry obrázků.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    f.isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p);
  }
})(DIST);

const exists = (l) => {
  const p = path.join(DIST, l);
  return fs.existsSync(p) && fs.statSync(p).isFile() ? true : fs.existsSync(path.join(p, 'index.html'));
};
const problems = [];
const titles = new Set();
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  const name = path.relative(DIST, f);
  for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) if (!exists(m[1])) problems.push(`${name}: rozbitý odkaz ${m[1]}`);
  if (name === '404.html') continue;
  const t = h.match(/<title>(.*?)<\/title>/s)?.[1] ?? '';
  const d = h.match(/name="description" content="(.*?)"/s)?.[1] ?? '';
  if (t.length > 60) problems.push(`${name}: title ${t.length} znaků (max 60)`);
  if (d.length > 160) problems.push(`${name}: description ${d.length} znaků (max 160)`);
  if (titles.has(t)) problems.push(`${name}: duplicitní title`);
  titles.add(t);
  if ((h.match(/<h1[ >]/g) || []).length !== 1) problems.push(`${name}: počet H1 není 1`);
  for (const i of h.match(/<img [^>]*>/g) || []) {
    if (!/alt=/.test(i)) problems.push(`${name}: img bez alt`);
    if (!/width=/.test(i) || !/height=/.test(i)) problems.push(`${name}: img bez rozměrů ${i.slice(0, 60)}`);
  }
}
assert.equal(problems.length, 0, '\n' + problems.join('\n'));
console.log(`OK: kontrola webu (${files.length} stránek)`);
