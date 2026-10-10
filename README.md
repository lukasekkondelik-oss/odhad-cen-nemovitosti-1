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
2. Settings → Environment Variables (Production):
   - `RESEND_API_KEY` – klíč z resend.com (ověř tam doménu odesílatele)
   - `MAIL_FROM` – např. `Název kanceláře <odhad@domena.cz>`
   - `AGENT_EMAIL` – e-mail makléřky (více oddělit čárkou)
   - volitelně `TURNSTILE_SECRET` (CAPTCHA), `LEAD_WEBHOOK_URL` (např. Make, viz níže)
3. Po přidání proměnných udělej Redeploy.
4. Settings → Domains → přidej doménu / subdoménu. Nastav `siteUrl` v `site.config.json`
   na skutečnou doménu a v Google Search Console odešli `/sitemap.xml`.

Poznámka: Vercel Hobby je pouze pro nekomerční použití. Pro web pracující pro firmu
(kancelář) počítej s plánem Pro (cca 20 USD/měsíc/uživatel) nebo použij jiný hosting.

## Jak formulář funguje
`POST /api/lead` (`api/lead.js`): kontrola původu, honeypot, minimální čas vyplnění,
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
