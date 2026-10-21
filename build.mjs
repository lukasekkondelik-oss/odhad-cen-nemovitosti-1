// Zero-dependency statický generátor: src/ + site.config.json -> dist/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const cfg = JSON.parse(read('site.config.json'));
const base = cfg.siteUrl.replace(/\/$/, '');

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const initials = (n) =>
  n.replace('[DOPLNIT]', '').trim().split(/\s+/).map((w) => w[0] || '').slice(0, 2).join('').toUpperCase() || '?';
const mdLinks = (s) => esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
const warnings = new Set();
let currentPage = null; // stránka, která se právě renderuje (pro předvolby formuláře)
const ver = crypto
  .createHash('sha1')
  .update(read('static/css/style.css') + read('static/js/main.js') + JSON.stringify(cfg.theme))
  .digest('hex')
  .slice(0, 8);
// Ikony (Lucide, licence ISC) – inline SVG, dědí barvu přes currentColor
const ICONS = {
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>',
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  tick: '<path d="M20 6 9 17l-5-5"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'
};
const svg = (n, w = 1.75, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const icon = (n) =>
  ICONS[n] ? `<span class="stat-icon" aria-hidden="true">${svg(n, 1.75, 26)}</span>` : '';

function aboutIntro(h) {
  const a = cfg.about;
  return `<section class="section about-intro"><div class="container profile-grid">
  <div class="photo-frame"><img src="${esc(a.photo)}" alt="${esc(a.photoAlt)}" loading="lazy">${a.badge ? `<div class="badge"><strong>${esc(a.badge.value)}</strong><span>${esc(a.badge.label)}</span></div>` : ''}</div>
  <div class="profile-text"><p class="eyebrow">${esc(a.eyebrow)}</p><${h}>${esc(a.titleLead)} <em>${esc(a.titleAccent)}</em></${h}><div class="rule"></div>
  <blockquote class="quote">„${esc(a.quote)}“</blockquote>
  ${a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
  <ul class="checks">${a.checks.map((x) => `<li><span class="tick">${svg('tick', 2.5, 15)}</span>${esc(x)}</li>`).join('')}</ul>
  <p class="btn-row"><a class="btn btn-accent" href="/kontakt/">${esc(a.cta)}</a> <a class="btn btn-outline" href="${esc(cfg.company.mainSite)}" rel="noopener" target="_blank">${esc(cfg.company.mainSiteLabel)} ↗</a></p></div></div></section>`;
}

// ---------- helpery vkládané do šablon ({{@nazev}}) ----------
const helpers = {
  nav: () => cfg.nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join(''),

  logo: () =>
    cfg.brand.logo
      ? `<img src="${esc(cfg.brand.logo)}" alt="${esc(cfg.brand.logoAlt)}" width="158" height="58">`
      : `<span class="wordmark">${esc(cfg.brand.name)}</span>`,

  contacts: () =>
    `<ul class="contacts">${cfg.company.contacts
      .map((p) => `<li><a href="tel:${esc(p.phone.replace(/\s/g, ''))}">${esc(p.phone)}</a><span class="who">${esc(p.name)}</span></li>`)
      .join('')}</ul>`,

  contactsInline: () =>
    cfg.company.contacts
      .map((p) => `<a href="tel:${esc(p.phone.replace(/\s/g, ''))}">${esc(p.phone)}</a> (${esc(p.name)})`)
      .join(', '),

  servicesLinks: () =>
    cfg.services.map((x) => `<a href="${esc(x.href)}">${esc(x.title)}</a>`).join('<br>'),

  hours: () =>
    `<ul class="hours">${cfg.company.hours.map((h) => `<li><strong>${esc(h.days)}</strong> <span>${esc(h.time)}</span></li>`).join('')}</ul>`,

  logoLight: () =>
    cfg.brand.logoLight
      ? `<img src="${esc(cfg.brand.logoLight)}" alt="${esc(cfg.brand.logoAlt)}" width="170" height="63" loading="lazy">`
      : `<span class="wordmark">${esc(cfg.brand.name)}</span><span class="brand-sub">${esc(cfg.brand.sub)}</span>`,

  stats: () =>
    cfg.stats.map((s) => `<div class="stat">${icon(s.icon)}<strong>${esc(s.value)}</strong><span class="lbl">${esc(s.label)}</span></div>`).join(''),

  steps: () =>
    cfg.steps
      .map((s, i) => `<li class="step"><span class="step-num">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`)
      .join(''),

  services: () =>
    cfg.services
      .map((s) => `<a class="card" href="${esc(s.href)}"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><span class="more">Zjistit více →</span></a>`)
      .join(''),

  values: () =>
    cfg.about.values.map((v) => `<div class="card"><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join(''),

  locations: () =>
    cfg.locations
      .map((l) => `<a class="chip" href="/odhad-nemovitosti-${esc(l.slug)}/">Odhad nemovitosti ${esc(l.locative)}</a>`)
      .join(''),

  locationsBlock: () =>
    cfg.locations.length ? `<p class="footer-title">Lokality</p><p class="chips">${helpers.locations()}</p>` : '',

  aboutIntro: () => aboutIntro('h2'),
  aboutIntroH1: () => aboutIntro('h1'),

  teamHead: () =>
    `<div class="section-head"><p class="eyebrow">${esc(cfg.team.eyebrow)}</p><h2>${esc(cfg.team.title)}</h2><div class="rule rule-center"></div><p class="section-lead">${esc(cfg.team.intro)}</p></div>`,

  locationsHome: () =>
    cfg.locations.length ? `<h3 class="loc-title">Odhad nemovitosti podle lokality</h3><p class="chips">${helpers.locations()}</p>` : '',

  team: () =>
    cfg.team.members
      .map((m, i) => {
        const rev = i % 2 === 1;
        const photo = m.photo
          ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy">`
          : `<div class="avatar-lg" aria-hidden="true">${esc(initials(m.name))}</div>`;
        const stats = (m.stats || []).map((x) => `<div class="mini-stat"><strong>${esc(x.value)}</strong><span>${esc(x.label)}</span></div>`).join('');
        const contact = [
          m.phone && `<a href="tel:${esc(m.phone.replace(/\s/g, ''))}">${svg('phone')}${esc(m.phone)}</a>`,
          m.email && `<a href="mailto:${esc(m.email)}">${svg('mail')}${esc(m.email)}</a>`
        ].filter(Boolean).join('');
        return `<section class="profile${rev ? ' profile-rev alt' : ''}"><div class="container profile-grid">
  <div class="photo-frame${rev ? ' photo-frame-rev' : ''}">${photo}${m.badge ? `<div class="badge"><strong>${esc(m.badge.value)}</strong><span>${esc(m.badge.label)}</span></div>` : ''}</div>
  <article class="profile-text"><p class="eyebrow">${esc(m.role)}</p><h3>${esc(m.name)}</h3><div class="rule"></div>
  ${m.quote ? `<blockquote class="quote">„${esc(m.quote)}“</blockquote>` : ''}
  ${(m.bio || []).map((p) => `<p>${esc(p)}</p>`).join('')}
  ${stats ? `<div class="mini-stats">${stats}</div>` : ''}
  ${contact ? `<p class="contact-line">${contact}</p>` : ''}</article></div></section>`;
      })
      .join(''),

  faq: () =>
    cfg.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join(''),

  form: () => {
    const f = cfg.form;
    const field = (x) => {
      const id = `f-${x.name}`;
      const req = x.required ? ' required' : '';
      const ac = x.autocomplete ? ` autocomplete="${esc(x.autocomplete)}"` : '';
      const ph = x.placeholder ? ` placeholder="${esc(x.placeholder)}"` : '';
      let input;
      if (x.type === 'select') {
        input = `<select id="${id}" name="${esc(x.name)}"${req}><option value="">Vyberte…</option>${x.options
          .map((o) => `<option${currentPage && currentPage.preselect && currentPage.preselect[x.name] === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      } else if (x.type === 'textarea') {
        input = `<textarea id="${id}" name="${esc(x.name)}" rows="3"${ph}></textarea>`;
      } else {
        const extra = x.type === 'number' ? ' min="0" step="any" inputmode="decimal"' : '';
        input = `<input id="${id}" name="${esc(x.name)}" type="${esc(x.type)}"${req}${ac}${ph}${extra}>`;
      }
      return `<div class="field${x.width === 'full' ? ' full' : ''}"><label for="${id}">${esc(x.label)}${x.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${input}</div>`;
    };
    return `<form id="lead-form" class="lead-form" novalidate data-sending="${esc(f.sending)}" data-submit="${esc(f.submit)}" data-success="${esc(f.success)}" data-error="${esc(f.error)}">
  <div class="grid">${f.fields.map(field).join('')}</div>
  <div class="hp" aria-hidden="true"><label>Nevyplňovat <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
  <input type="hidden" name="ts" value="">
  <label class="consent"><input type="checkbox" name="consent" required> <span>${mdLinks(f.consent)}</span></label>
  <button class="btn btn-accent" type="submit">${esc(f.submit)}</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>`;
  },

  year: () => String(new Date().getFullYear()),

  social: () =>
    Object.entries(cfg.company.social)
      .filter(([, v]) => v)
      .map(([k, v]) => `<a href="${esc(v)}" rel="noopener me" target="_blank">${esc(k[0].toUpperCase() + k.slice(1))}</a>`)
      .join(' · '),

  analytics: () =>
    `<script>window.__GA_ID=${JSON.stringify(cfg.analytics.gaId || '')};</script>`,

  fontLink: () =>
    cfg.theme.fontStylesheet
      ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${esc(cfg.theme.fontStylesheet)}">`
      : ''
};

// ---------- JSON-LD ----------
function jsonLd(page, loc) {
  const c = cfg.company;
  const org = {
    '@type': ['RealEstateAgent', 'LocalBusiness'],
    '@id': `${base}/#organization`,
    name: cfg.brand.name,
    legalName: c.legalName,
    alternateName: `${cfg.brand.name} ${cfg.brand.sub}`,
    url: base + '/',
    logo: cfg.brand.logo ? base + cfg.brand.logo : undefined,
    image: base + cfg.brand.ogImage,
    telephone: c.contacts.map((p) => p.phone),
    contactPoint: c.contacts.map((p) => ({ '@type': 'ContactPoint', name: p.name, telephone: p.phone, email: c.email, contactType: 'customer service', areaServed: 'CZ', availableLanguage: ['cs'] })),
    email: c.email,
    description: cfg.brand.tagline,
    openingHours: c.openingHoursSchema,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.street,
      addressLocality: c.city,
      postalCode: c.zip,
      addressCountry: 'CZ'
    },
    areaServed: cfg.locations.length ? cfg.locations.map((l) => ({ '@type': 'AdministrativeArea', name: l.name })) : undefined,
    sameAs: [c.mainSite, ...Object.values(c.social).filter(Boolean)],
    employee: cfg.team.members.map((m) => ({ '@type': 'Person', name: m.name, jobTitle: m.role }))
  };
  const graph = [org, { '@type': 'WebSite', '@id': `${base}/#website`, url: base + '/', name: cfg.brand.name, inLanguage: cfg.lang }];
  if (page.url !== base + '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Domů', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: page.crumb || page.title, item: page.url }
      ]
    });
  }
  if (page.faq) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: cfg.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
    });
  }
  if (page.service) {
    graph.push({
      '@type': 'Service',
      name: page.serviceName || page.title,
      serviceType: page.serviceType || 'Odhad ceny nemovitosti',
      provider: { '@id': `${base}/#organization` },
      areaServed: loc ? { '@type': 'AdministrativeArea', name: loc.name } : undefined,
      offers: page.paid ? undefined : { '@type': 'Offer', price: '0', priceCurrency: 'CZK' }
    });
  }
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

// ---------- šablonovací jádro ----------
const partial = (n) => read(`src/partials/${n}.html`);

function render(tpl, ctx) {
  currentPage = ctx.page || currentPage;
  let out = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partial(n));
  out = out.replace(/\{\{@([\w-]+)\}\}/g, (_, n) => {
    if (n === 'jsonld') return jsonLd(ctx.page, ctx.loc);
    if (!helpers[n]) throw new Error(`Neznámý helper @${n}`);
    return helpers[n]();
  });
  out = out.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p) => String(get(ctx, p) ?? ''));
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => {
    const v = get(ctx, p);
    if (v === undefined) warnings.add(`Nedefinovaná hodnota {{${p}}}`);
    return esc(v);
  });
  return out;
}

function parsePage(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Chybí <!--meta {...}--> v ${file}`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

const pages = []; // pro sitemap
function emit(meta, body, extraCtx = {}) {
  const urlPath = meta.path; // např. "/" nebo "/o-nas/"
  const page = {
    ...meta,
    url: base + urlPath,
    ogImage: base + cfg.brand.ogImage,
    robots: meta.noindex || !cfg.indexing ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
  };
  const ctx = { ver, site: cfg, brand: cfg.brand, company: cfg.company, hero: cfg.hero, about: cfg.about, team: cfg.team, form: cfg.form, page, ...extraCtx };
  const content = render(body, ctx);
  const html = render(fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8').replace('{{{content}}}', () => content), ctx);
  const outFile = meta.file ? path.join(DIST, meta.file) : path.join(DIST, urlPath, 'index.html');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  if (!meta.noindex) pages.push({ loc: page.url, priority: meta.priority ?? 0.6 });
}

// ---------- build ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'static'), DIST, { recursive: true });

for (const f of fs.readdirSync(path.join(SRC, 'pages'))) {
  const { meta, body } = parsePage(path.join(SRC, 'pages', f));
  emit(meta, body);
}

// stránky lokalit (lokální SEO) z jedné šablony
{
  const { meta, body } = parsePage(path.join(SRC, 'templates', 'location.html'));
  for (const loc of cfg.locations) {
    const ctx = { loc, locAreas: loc.areas.join(', ') };
    const m = JSON.parse(
      JSON.stringify(meta).replace(/%(name|locative|region)%/g, (_, k) => loc[k].replace(/"/g, '\\"'))
    );
    m.path = `/odhad-nemovitosti-${loc.slug}/`;
    const areaList = `<ul class="areas">${loc.areas.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`;
    emit(m, body.replace('{{{areaList}}}', areaList), ctx);
  }
}

// theme.css z konfigurace
const t = cfg.theme;
fs.mkdirSync(path.join(DIST, 'css'), { recursive: true });
fs.writeFileSync(
  path.join(DIST, 'css', 'theme.css'),
  `/* Generováno z site.config.json -> theme */
:root{--c-primary:${t.primary};--c-primary-dark:${t.primaryDark};--c-accent:${t.accent};--c-accent-dark:${t.accentDark};--c-accent-text:${t.accentText};--c-divider:${t.divider};--c-footer-text:${t.footerText};--c-footer-link:${t.footerLink};--c-footer-muted:${t.footerMuted};--c-footer-line:${t.footerLine};--c-bg:${t.background};--c-surface:${t.surface};--c-text:${t.text};--c-muted:${t.muted};--c-border:${t.border};--c-on-primary:${t.onPrimary};--c-on-accent:${t.onAccent};--radius:${t.radius};--font-body:${t.fontBody};--font-heading:${t.fontHeading}}\n`
);

// sitemap + robots (jen pokud je web ostrý, jinak se skryje před vyhledávači)
const today = new Date().toISOString().slice(0, 10);
if (cfg.indexing) {
  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
      .map((p) => `  <url><loc>${p.loc}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`)
      .join('\n')}\n</urlset>\n`
  );
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`);
} else {
  fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  warnings.add('indexing=false: web je SKRYTÝ před vyhledávači (před spuštěním přepni na true)');
}

// pole formuláře pro serverless funkci (validace na straně serveru)
fs.mkdirSync(path.join(ROOT, 'api', '_lib'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'api', '_lib', 'fields.generated.js'),
  '// Generováno buildem z site.config.json – needitovat\nexport default ' +
    JSON.stringify({ brand: cfg.brand.name, company: { ...cfg.company, phonesText: cfg.company.contacts.map((p) => `${p.phone} (${p.name})`).join(' · ') }, fields: cfg.form.fields }, null, 2) + ';\n'
);

// varování na nedoplněné údaje
const todo = (read('site.config.json').match(/\[DOPLNIT\]/g) || []).length;
if (todo) warnings.add(`V site.config.json zbývá ${todo}× [DOPLNIT]`);
if (cfg.siteUrl.includes('example')) warnings.add('siteUrl je stále example – nastav skutečnou doménu');
console.log(`OK: ${pages.length} indexovatelných stránek -> dist/`);
for (const w of warnings) console.warn('⚠ ', w);
