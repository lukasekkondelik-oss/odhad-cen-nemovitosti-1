// POST /api/lead (Vercel Function, Node.js) – přijme formulář, zvaliduje,
// pošle e-mail makléři i klientovi. Proměnné prostředí: viz README.
import cfg from './_lib/fields.generated.js';
import { sendMail } from './_lib/mail.js';
import { clientEmail, agentEmail } from './_lib/emails.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max = 2000) =>
  String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

// Čistá logika (bez req/res) – snadno testovatelná. Vrací { status, body }.
export async function processLead({ body, headers = {}, env }) {
  const r = (status, b) => ({ status, body: b });
  if (!body || typeof body !== 'object') return r(400, { ok: false, error: 'bad_json' });

  // stejný původ (základní ochrana proti cizím formulářům)
  const origin = headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch {}
    if (host !== headers.host) return r(403, { ok: false, error: 'origin' });
  }

  // honeypot a příliš rychlé odeslání = bot; tvářit se, že vše OK
  if (clean(body.website)) return r(200, { ok: true });
  const ts = Number(body.ts);
  if (ts && Date.now() - ts < 3000) return r(200, { ok: true });

  if (body.consent !== true) return r(400, { ok: false, error: 'consent' });

  // Cloudflare Turnstile (CAPTCHA) (volitelné – zapne se nastavením TURNSTILE_SECRET)
  if (env.TURNSTILE_SECRET) {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: clean(body['cf-turnstile-response']) })
    });
    const t = await res.json().catch(() => ({}));
    if (!t.success) return r(400, { ok: false, error: 'captcha' });
  }

  // validace podle definice polí z site.config.json
  const data = {};
  const labelled = [];
  for (const f of cfg.fields) {
    const v = clean(body[f.name], f.type === 'textarea' ? 2000 : 300);
    if (f.required && !v) return r(400, { ok: false, error: `missing:${f.name}` });
    if (v && f.type === 'email' && !EMAIL_RE.test(v)) return r(400, { ok: false, error: `invalid:${f.name}` });
    if (v && f.type === 'select' && !f.options.includes(v)) return r(400, { ok: false, error: `invalid:${f.name}` });
    data[f.name] = v;
    if (v) labelled.push({ name: f.name, label: f.label, value: v });
  }
  if (!data.email || !data.name) return r(500, { ok: false, error: 'config' }); // formulář musí mít pole name a email

  const meta = {
    receivedAt: new Date().toISOString(),
    ip: String(headers['x-forwarded-for'] || '').split(',')[0].trim(),
    page: headers.referer || ''
  };
  const ctx = { data, labelled, meta, site: cfg };

  try {
    // příjemce poptávek: AGENT_EMAIL (volitelně přepíše), jinak firemní e-mail z konfigurace
    const agents = String(env.AGENT_EMAIL || cfg.company.email || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!agents.length) throw new Error('Není nastaven příjemce poptávek');
    // odesílatel (Resend): MAIL_FROM, jinak odhad@<doména firemního e-mailu>
    const from = env.MAIL_FROM || `${cfg.brand} <odhad@${String(cfg.company.email).split('@')[1]}>`;
    const agentMail = agentEmail(ctx);
    const clientMail = clientEmail(ctx);

    // A) Make (nebo jiná automatizace): hlavní cesta, pokud je nastaven LEAD_WEBHOOK_URL.
    //    Make dostane hotové e-maily i všechna pole a jen je odešle ze schránky kanceláře.
    if (env.LEAD_WEBHOOK_URL) {
      const payload = {
        source: 'web',
        ...meta,
        serviceType: data.serviceType || '',
        data,
        fields: labelled.map(({ name, label, value }) => ({ name, label, value })),
        agent: { to: agents, toText: agents.join(','), replyTo: data.email, ...agentMail },
        client: { to: [data.email], toText: data.email, replyTo: agents[0], ...clientMail }
      };
      const ok = await postWebhook(env.LEAD_WEBHOOK_URL, payload);
      if (ok) return r(200, { ok: true });
      console.error('webhook failed');
      if (!env.RESEND_API_KEY) throw new Error('Webhook selhal a není záložní Resend');
      // jinak pokračuje záložní odeslání přes Resend
    }

    // B) Resend: 1) lead pro makléře – nejdůležitější, jde první
    await sendMail(env, { from, to: agents, replyTo: data.email, ...agentMail });
    //    2) potvrzení klientovi – selhání neshodí požadavek (lead už je doručen)
    try { await sendMail(env, { from, to: [data.email], replyTo: agents[0], ...clientMail }); }
    catch (e) { console.error('client mail failed', e.message); }
    return r(200, { ok: true });
  } catch (e) {
    console.error('lead failed', e.message);
    return r(502, { ok: false, error: 'send_failed' });
  }
}

async function postWebhook(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
  const { status, body } = await processLead({ body: req.body, headers: req.headers, env: process.env });
  return res.status(status).json(body);
}
