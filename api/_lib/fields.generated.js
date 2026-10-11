// Generováno buildem z site.config.json – needitovat
export default {
  "brand": "ALFA ESTATE",
  "company": {
    "legalName": "ALFA ESTATE V&S Partners s.r.o.",
    "ico": "10799796",
    "dic": "[DOPLNIT] (CZ10799796, pokud je plátce DPH)",
    "address": "Majakovského 707/29, Rybáře, 360 05 Karlovy Vary",
    "street": "Majakovského 707/29, Rybáře",
    "city": "Karlovy Vary",
    "zip": "360 05",
    "register": "[DOPLNIT] Zapsána v obchodním rejstříku vedeném u [DOPLNIT] soudu, oddíl C, vložka [DOPLNIT]",
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
    "phoneName": "Soňa Petříková",
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
    ]
  },
  "fields": [
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
      "label": "Účel odhadu",
      "type": "select",
      "options": [
        "Chci prodat",
        "Zvažuji prodej",
        "Dědictví / vypořádání",
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
  ]
};
