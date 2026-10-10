// Šablony e-mailů. TEXTY JSOU ZÁSTUPNÉ – nahraď je dodanými texty.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const wrap = (inner, site) => `<!doctype html><html lang="cs"><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1d2430">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1f3a5f;color:#fff;padding:20px 28px;font-size:20px;font-weight:bold">${esc(site.brand)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${inner}</td></tr>
<tr><td style="padding:16px 28px;background:#f5f6f8;font-size:12px;color:#5b6574">${esc(site.company.legalName)} · IČO ${esc(site.company.ico)} · ${esc(site.company.address)}<br>${esc(site.company.phone)} · ${esc(site.company.email)}</td></tr>
</table></td></tr></table></body></html>`;

const rows = (items) =>
  `<table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse">${items
    .map((i) => `<tr><td style="border-bottom:1px solid #eee;color:#5b6574;width:40%">${esc(i.label)}</td><td style="border-bottom:1px solid #eee"><strong>${esc(i.value)}</strong></td></tr>`)
    .join('')}</table>`;

// ---- E-MAIL KLIENTOVI (potvrzení + informace) ----
export function clientEmail({ data, labelled, site }) {
  const subject = `Děkujeme za poptávku odhadu – ${site.brand}`;
  // TODO: nahradit dodaným textem
  const intro = `Dobrý den, ${data.name},`;
  const body = [
    'děkujeme za váš zájem o odhad ceny nemovitosti. Vaši poptávku jsme přijali.',
    'Náš makléř se vám ozve do 24 hodin v pracovní dny. [ZDE VLOŽIT DODANÝ TEXT E-MAILU]'
  ];
  const html = wrap(
    `<p>${esc(intro)}</p>${body.map((p) => `<p>${esc(p)}</p>`).join('')}<p style="margin-top:24px"><strong>Shrnutí vaší poptávky</strong></p>${rows(labelled)}<p style="margin-top:24px">S pozdravem<br>${esc(site.brand)}</p>`,
    site
  );
  const text = [intro, '', ...body, '', 'Shrnutí poptávky:', ...labelled.map((i) => `${i.label}: ${i.value}`), '', `S pozdravem, ${site.brand}`].join('\n');
  return { subject, html, text };
}

// ---- E-MAIL MAKLÉŘCE (nový lead k provolání) ----
export function agentEmail({ data, labelled, meta, site }) {
  const subject = `🔔 Nový lead – odhad: ${data.name}, ${data.phone || data.email}`;
  const contact = [
    { label: 'Jméno', value: data.name },
    { label: 'Telefon', value: data.phone || '—' },
    { label: 'E-mail', value: data.email }
  ];
  const rest = labelled.filter((i) => !['name', 'phone', 'email'].includes(i.name));
  const tel = data.phone ? String(data.phone).replace(/[^\d+]/g, '') : '';
  const html = wrap(
    `<p style="font-size:18px"><strong>Nový lead k provolání</strong></p>
${rows(contact)}
${tel ? `<p><a href="tel:${esc(tel)}" style="display:inline-block;background:#c8a15a;color:#1d2430;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Zavolat ${esc(data.phone)}</a></p>` : ''}
<p style="margin-top:24px"><strong>Údaje o nemovitosti</strong></p>${rows(rest)}
<p style="font-size:12px;color:#5b6574;margin-top:24px">Přijato: ${esc(meta.receivedAt)}${meta.page ? ` · Stránka: ${esc(meta.page)}` : ''}</p>`,
    site
  );
  const text = [
    'NOVÝ LEAD K PROVOLÁNÍ',
    ...contact.map((i) => `${i.label}: ${i.value}`),
    '',
    ...rest.map((i) => `${i.label}: ${i.value}`),
    '',
    `Přijato: ${meta.receivedAt}`
  ].join('\n');
  return { subject, html, text };
}
