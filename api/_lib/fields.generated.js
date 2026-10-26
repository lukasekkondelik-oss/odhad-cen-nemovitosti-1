// Generováno buildem z site.config.json – needitovat
export default {
  "brand": "ALFA ESTATE",
  "company": {
    "legalName": "ALFA ESTATE V&S Partners s.r.o.",
    "ico": "10799796",
    "dic": "CZ10799796",
    "address": "V. Meerwalda 57/8, 360 06 Karlovy Vary – Dvory",
    "street": "Majakovského 707/29",
    "city": "Karlovy Vary",
    "zip": "360 05",
    "register": "Společnost je zapsána v obchodním rejstříku vedeném Krajským soudem v Plzni, oddíl C, vložka 40638. Živnostenský úřad: Magistrát města Karlovy Vary.",
    "phone": "+420 603 382 392",
    "email": "alfaestate@alfaestate.cz",
    "privacyEmail": "alfaestate@alfaestate.cz",
    "mainSite": "https://alfaestate.cz/",
    "mainSiteLabel": "alfaestate.cz",
    "social": {
      "facebook": "",
      "instagram": "",
      "linkedin": ""
    },
    "openingHoursSchema": "Mo-Fr 09:00-17:00",
    "summary": "Certifikovaná realitní kancelář v Karlových Varech. Člen Realitní komory ČR. Přes 16 let na realitním trhu Karlovarského kraje.",
    "hours": [
      {
        "days": "Po–Pá",
        "time": "9:00–17:00"
      },
      {
        "days": "So",
        "time": "dle dohody"
      },
      {
        "days": "Ne",
        "time": "zavřeno"
      }
    ],
    "officeAddress": "Majakovského 707/29, 360 05 Karlovy Vary – Rybáře",
    "contacts": [
      {
        "name": "Soňa Petříková",
        "phone": "+420 603 382 392"
      },
      {
        "name": "Vít Čirik",
        "phone": "+420 776 686 776"
      }
    ],
    "phonesText": "+420 603 382 392 (Soňa Petříková) · +420 776 686 776 (Vít Čirik)"
  },
  "fields": [
    {
      "name": "serviceType",
      "label": "Co potřebujete",
      "type": "select",
      "required": true,
      "width": "full",
      "options": [
        "Tržní odhad ceny nemovitosti",
        "Odhad pro dědické řízení",
        "Znalecký posudek"
      ]
    },
    {
      "name": "propertyType",
      "label": "Typ nemovitosti",
      "type": "select",
      "required": true,
      "options": [
        "Byt",
        "Rodinný dům",
        "Pozemek",
        "Jiné"
      ]
    },
    {
      "name": "address",
      "label": "Adresa / lokalita",
      "type": "text",
      "required": true,
      "placeholder": "Ulice, město"
    },
    {
      "name": "disposition",
      "label": "Dispozice",
      "type": "select",
      "options": [
        "1+kk",
        "1+1",
        "2+kk",
        "2+1",
        "3+kk",
        "3+1",
        "4+kk",
        "4+1",
        "5+ a větší",
        "Neuvedeno"
      ]
    },
    {
      "name": "area",
      "label": "Užitná plocha (m²)",
      "type": "number",
      "placeholder": "např. 65"
    },
    {
      "name": "condition",
      "label": "Stav nemovitosti",
      "type": "select",
      "options": [
        "Novostavba",
        "Po rekonstrukci",
        "Dobrý",
        "Před rekonstrukcí",
        "Špatný"
      ]
    },
    {
      "name": "reason",
      "label": "Důvod zájmu",
      "type": "select",
      "options": [
        "Chci prodat",
        "Zvažuji prodej",
        "Jen mě zajímá cena",
        "Jiné"
      ]
    },
    {
      "name": "note",
      "label": "Poznámka",
      "type": "textarea",
      "width": "full",
      "placeholder": "Cokoli dalšího, co nám pomůže"
    },
    {
      "name": "name",
      "label": "Jméno a příjmení",
      "type": "text",
      "required": true,
      "autocomplete": "name"
    },
    {
      "name": "phone",
      "label": "Telefon",
      "type": "tel",
      "required": true,
      "autocomplete": "tel"
    },
    {
      "name": "email",
      "label": "E-mail",
      "type": "email",
      "required": true,
      "autocomplete": "email"
    }
  ],
  "confirmClient": false
};
