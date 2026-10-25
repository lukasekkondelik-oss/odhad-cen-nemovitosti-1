# Odhad cen nemovitostí – web pro realitní kancelář

Statický web (bez frameworku, bez závislostí) + jedna serverless funkce pro formulář.
Žádný n8n ani jiný nástroj navíc. E-maily přes Resend (free tier 3 000/měsíc), hosting Vercel.

## Co upravuješ
| Co | Kde |
|---|---|
| Brand (barvy, fonty, logo), firemní údaje, tým, FAQ, lokality, **pole formuláře** | `site.config.json` |
| Logo, fotky týmu | `static/assets/` (cesty pak do configu) |
| Texty e-mailů (klient + makléřka) | `api/_lib/emails.js` |
| Texty stránek | `src/pages/*.html` |
| Nová lokalita (SEO stránka) | přesunout vzor z `_locationsExample` do `locations` v configu |

Build vypíše varování `[DOPLNIT]`, dokud zbývají nevyplněné údaje.

## Příkazy
```
npm run build   # vygeneruje dist/ (sitemap, robots, JSON-LD, stránky lokalit)
npm test        # build + test funkce /api/lead
npm run dev     # lokálně vč. funkce (vercel dev), potřebuje .env.local podle .env.example
```

## Nasazení na Vercel (zdarma, plán Hobby)
1. Vercel → Add New → Project → importuj tento GitHub repozitář (nebo `vercel` v terminálu).
   Nastavení se načte z `vercel.json` (Build: `node build.mjs`, Output: `dist`, Framework: Other).
2. Settings → Environment Variables (Production). **Povinná je jen jedna:**
   - `RESEND_API_KEY` – klíč z resend.com
   Poptávky chodí na firemní e-mail z `site.config.json` (`company.email`, tj. alfaestate@alfaestate.cz), odesílatelem je `odhad@<doména>`; doména odesílatele musí být v Resendu ověřená.
   Volitelně: `MAIL_FROM` (jiný odesílatel, např. z již ověřené domény), `AGENT_EMAIL` (jiný příjemce / více adres), `TURNSTILE_SECRET` (CAPTCHA), `LEAD_WEBHOOK_URL` (např. Make, viz níže)
3. Po přidání proměnných udělej Redeploy.
4. Settings → Domains → přidej doménu / subdoménu. Nastav `siteUrl` v `site.config.json`
   na skutečnou doménu a v Google Search Console odešli `/sitemap.xml`.

Poznámka: Vercel Hobby je pouze pro nekomerční použití. Pro web pracující pro firmu
(kancelář) počítej s plánem Pro (cca 20 USD/měsíc/uživatel) nebo použij jiný hosting.

## Jak formulář funguje
`POST /api/lead` (`api/lead.js`): kontrola původu, honeypot, minimální čas vyplnění,
volitelně Turnstile, validace podle polí z configu, potom (1) e-mail makléřce, (2) potvrzení klientovi.
Lead jde první, selhání potvrzení klientovi ho neztratí.

## Odesílání e-mailů přes Make (alternativa k Resendu)
Pokud nastavíš `LEAD_WEBHOOK_URL` (Custom webhook v Make), je Make **hlavní cesta**: funkce na serveru ověří formulář a pošle do Make JSON s polem `fields`, s hotovým e-mailem pro makléře (`agent`: `toText`, `subject`, `html`, `text`, `replyTo`) a pro klienta (`client`: totéž). Scénář v Make má jen tři moduly: Webhook, e-mail makléři (Gmail/Microsoft 365/SMTP ze schránky kanceláře), e-mail klientovi.
- Selže-li webhook a je nastaven `RESEND_API_KEY`, odešle se záložně přes Resend. Bez Resendu uživatel uvidí chybu a může zavolat.
- Webhook URL je tajná, proto formulář neposílá data do Make z prohlížeče, ale přes `/api/lead`.
- V Make zapni „Store incomplete executions" a e-mailové upozornění na chyby scénáře.
- Make je další zpracovatel osobních údajů: zvol EU zónu a doplň ho do zásad ochrany osobních údajů.

## Neveřejné zobrazení (před spuštěním)
- `indexing: false` v `site.config.json` (výchozí) přidá `noindex`, `Disallow: /` v robots.txt a vynechá sitemap, takže web Google nenajde.
- Pro omezení přístupu používej Vercel Deployment Protection (Settings → Deployment Protection); náhledy větví jsou chráněné přihlášením do Vercelu.
- Při ostrém spuštění přepni `indexing` na `true`.

## Před spuštěním
- Právní stránky jsou šablony → nechat zkontrolovat právníkem.
- `og-image.svg` nahradit PNG 1200×630 (sociální sítě SVG nezobrazují).
- Doplnit logo, favicon, fotky týmu, IČO, sídlo, e-maily.
- Font Space Grotesk je hostovaný lokálně (static/assets/fonts), ne z Google CDN.
