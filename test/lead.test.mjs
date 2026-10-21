// Jednoduchý test /api/lead s mockovaným fetchem (žádné závislosti).
import assert from 'node:assert/strict';
import { processLead } from '../api/lead.js';

const sent = [];
globalThis.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body) });
  return new Response('{}', { status: 200 });
};
const env = { RESEND_API_KEY: 'k', MAIL_FROM: 'a <a@b.cz>', AGENT_EMAIL: 'makler@b.cz' };
import cfg from '../api/_lib/fields.generated.js';
const call = (body, e = env, headers = {}) => processLead({ body, headers, env: e });
const good = { serviceType: 'Odhad pro dědické řízení', propertyType: 'Byt', address: 'Praha', name: 'Jan <b>Novák</b>', phone: '777 111 222', email: 'jan@test.cz', consent: true, ts: Date.now() - 10000 };

let r = await call(good);
assert.equal(r.status, 200);
assert.equal(sent.length, 2, 'dva e-maily');
assert.deepEqual(sent[0].body.to, ['makler@b.cz']);
assert.deepEqual(sent[1].body.to, ['jan@test.cz']);
assert.ok(!sent[0].body.html.includes('<b>Novák'), 'HTML je escapované');

sent.length = 0;
assert.equal((await call({ ...good, website: 'spam' })).status, 200);
assert.equal(sent.length, 0, 'honeypot neposílá');
assert.equal((await call(good, env, { origin: 'https://evil.cz', host: 'x.cz' })).status, 403);
assert.equal((await call(good, env, { origin: 'https://x.cz', host: 'x.cz' })).status, 200);

assert.equal((await call({ ...good, consent: false })).status, 400);
assert.equal((await call({ ...good, email: 'zle' })).status, 400);
assert.equal((await call({ ...good, propertyType: 'Hrad' })).status, 400);
assert.equal((await call({ ...good, name: '' })).status, 400);
assert.equal((await call({ ...good, serviceType: '' })).status, 400);
// bez AGENT_EMAIL a MAIL_FROM jde poptávka na firemní e-mail a odesílá se z odhad@<doména>
sent.length = 0;
r = await call(good, { RESEND_API_KEY: 'k' });
assert.equal(r.status, 200);
assert.deepEqual(sent[0].body.to, [cfg.company.email], 'výchozí příjemce = firemní e-mail');
assert.ok(sent[0].body.from.includes('odhad@' + cfg.company.email.split('@')[1]), 'výchozí odesílatel');
assert.equal((await call(good, {})).status, 502, 'bez API klíče chyba');
console.log('lead.test OK');
