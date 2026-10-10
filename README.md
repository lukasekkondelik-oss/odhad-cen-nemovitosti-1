# Odhad cen nemovitostí – web pro realitní kancelář

Statický web (bez frameworku, bez závislostí) + jedna serverless funkce pro formulář.
Žádný n8n ani jiný placený nástroj. Náklady: 0 Kč (Cloudflare Pages + Resend free tier).

## Co upravuješ
| Co | Kde |
|---|---|
| Brand (barvy, fonty, logo), firemní údaje, tým, FAQ, lokality, **pole formuláře** | `site.config.json` |
| Logo, fotky týmu | `static/assets/` (cesty pak do configu) |
| Texty e-mailů (klient + makléřka) | `functions/_lib/emails.js` |
| Texty stránek | `src/pages/*.html` |
| Nová lokalita (SEO stránka) | přidat objekt do `locations` v configu |

Build vypíše varování `[DOPLNIT]`, dokud zbývají nevyplněné údaje.

## Příkazy
```
npm run build   # vygeneruje dist/ (sitemap, robots, JSON-LD, stránky lokalit)
npm test        # build + test funkce /api/lead
npm run dev     # lokálně vč. funkce (wrangler), potřebuje .dev.vars
```

## Nasazení (Cloudflare Pages, zdarma)
1. Cloudflare → Pages → Connect to Git → tento repozitář.
2. Build command: `node build.mjs`, Output directory: `dist`.
3. Settings → Variables (Production):
   - `RESEND_API_KEY` – klíč z resend.com (ověř tam doménu odesílatele)
   - `MAIL_FROM` – např. `Název kanceláře <odhad@domena.cz>`
   - `AGENT_EMAIL` – e-mail makléřky (více oddělit čárkou)
   - volitelně `TURNSTILE_SECRET` (CAPTCHA), `LEAD_WEBHOOK_URL` (např. Make, viz níže)
4. Nastav `siteUrl` v configu na skutečnou doménu a v Search Console odešli `/sitemap.xml`.

## Jak formulář funguje
`POST /api/lead` (`functions/api/lead.js`): kontrola původu, honeypot, minimální čas vyplnění,
volitelně Turnstile, validace podle polí z configu, potom (1) e-mail makléřce, (2) potvrzení klientovi.
Lead jde první, selhání potvrzení klientovi ho neztratí.

## Make později
Nastav `LEAD_WEBHOOK_URL` na Custom webhook v Make. Funkce pošle JSON s poli formuláře.
Vše ostatní zůstane beze změny.

## Před spuštěním
- Právní stránky jsou šablony → nechat zkontrolovat právníkem.
- `og-image.svg` nahradit PNG 1200×630 (sociální sítě SVG nezobrazují).
- Doplnit logo, favicon, fotky týmu, IČO, sídlo, e-maily.
- Google Fonts raději nenačítat z CDN (GDPR) – fonty hostovat lokálně.
