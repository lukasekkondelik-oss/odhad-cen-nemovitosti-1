// POST /api/lead – přijme formulář, zvaliduje, pošle e-mail klientovi i makléři.
// Proměnné prostředí: viz README (RESEND_API_KEY, MAIL_FROM, AGENT_EMAIL, volitelně TURNSTILE_SECRET, LEAD_WEBHOOK_URL)
import cfg from '../_lib/fields.generated.json' with { type: 'json' };
import { sendMail } from '../_lib/mail.js';
import { clientEmail, agentEmail } from '../_lib/emails.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max = 2000) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

export async function onRequestPost({ request, env, waitUntil }) {
  // stejný původ (základní ochrana proti cizím formulářům)
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'origin' }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }

  // honeypot a příliš rychlé odeslání = bot; tvářit se, že vše OK
  if (clean(body.website)) return json({ ok: true });
  const ts = Number(body.ts);
  if (ts && Date.now() - ts < 3000) return json({ ok: true });

  if (body.consent !== true) return json({ ok: false, error: 'consent' }, 400);

  // Cloudflare Turnstile (volitelné – zapne se nastavením TURNSTILE_SECRET)
  if (env.TURNSTILE_SECRET) {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: clean(body['cf-turnstile-response']), remoteip: request.headers.get('CF-Connecting-IP') || '' })
    });
    const t = await r.json().catch(() => ({}));
    if (!t.success) return json({ ok: false, error: 'captcha' }, 400);
  }

  // validace podle definice polí z site.config.json
  const data = {};
  const labelled = [];
  for (const f of cfg.fields) {
    const v = clean(body[f.name], f.type === 'textarea' ? 2000 : 300);
    if (f.required && !v) return json({ ok: false, error: `missing:${f.name}` }, 400);
    if (v && f.type === 'email' && !EMAIL_RE.test(v)) return json({ ok: false, error: `invalid:${f.name}` }, 400);
    if (v && f.type === 'select' && !f.options.includes(v)) return json({ ok: false, error: `invalid:${f.name}` }, 400);
    data[f.name] = v;
    if (v) labelled.push({ name: f.name, label: f.label, value: v });
  }
  if (!data.email || !data.name) return json({ ok: false, error: 'config' }, 500); // formulář musí mít pole name a email

  const meta = {
    receivedAt: new Date().toISOString(),
    ip: request.headers.get('CF-Connecting-IP') || '',
    page: request.headers.get('Referer') || ''
  };
  const ctx = { data, labelled, meta, site: cfg };

  try {
    const agents = String(env.AGENT_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!agents.length) throw new Error('AGENT_EMAIL není nastaven');

    // 1) lead pro makléřku – nejdůležitější, jde první
    await sendMail(env, { to: agents, replyTo: data.email, ...agentEmail(ctx) });
    // 2) potvrzení klientovi – selhání neshodí požadavek (lead už je doručen)
    try { await sendMail(env, { to: [data.email], replyTo: agents[0], ...clientEmail(ctx) }); }
    catch (e) { console.error('client mail failed', e.message); }
    // 3) volitelně webhook (např. Make) – best effort
    if (env.LEAD_WEBHOOK_URL) {
      const p = fetch(env.LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, ...meta }) }).catch(() => {});
      if (waitUntil) waitUntil(p);
    }
    return json({ ok: true });
  } catch (e) {
    console.error('lead failed', e.message);
    return json({ ok: false, error: 'send_failed' }, 502);
  }
}

// ostatní metody (onRequestPost má pro POST přednost)
export const onRequest = () => json({ ok: false, error: 'method' }, 405);
