# 📝 Zapisovanie chyb GPT

Automatizovaný ChatGPT asistent pre zapisovanie a správu chýb cez Google Sheets.

## 🚀 Rýchly štart

### 1. Príprava Google Sheets

Vytvor Google Sheets tabuľku s týmito stĺpcami (prvý riadok):

| ID | Dátum | Typ | Priorita | Popis | Stav | Riešiteľ | Poznámky |
|----|-------|-----|----------|-------|------|----------|----------|

**Poznámka:** Nechaj prvý riadok ako hlavičku a dáta začni od druhého riadku.

### 2. Inštalácia

```bash
# Nainštaluj dependencies
npm install

# Skopíruj a uprav .env súbor
cp env.example .env
```

### 3. Konfigurácia `.env`

Uprav `.env` súbor:

```env
PORT=3000
API_KEY=sk_chyby_2025_secure_key_[tvoj_random_string]
SPREADSHEET_ID=[tvoj_google_sheets_id]
GOOGLE_CREDENTIALS_PATH=./google_credentials.json
```

**Ako získať `SPREADSHEET_ID`:**
Z URL tabuľky:
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit
                                        ↑ toto je SPREADSHEET_ID
```

### 4. Google Service Account

1. Choď na https://console.cloud.google.com
2. Vytvor Service Account (návod v `NAVOD_VYTVORENIE_GPT_AUTOMATIZACIE.md`)
3. Stiahni JSON kľúč → ulož ako `google_credentials.json`
4. **Dôležité:** Zdieľaj Google Sheets s emailom Service Accountu (z JSON súboru)

### 5. Spustenie

```bash
# Lokálne
npm start

# Development s auto-reload
npm run dev
```

Server beží na: http://localhost:3000

### 6. Test

```bash
# Health check
curl http://localhost:3000/health

# Získaj všetky chyby (zmeň API_KEY)
curl -X GET http://localhost:3000/api/chyby \
  -H "X-Chyby-API-Key: sk_chyby_2025_secure_key_..."

# Pridaj chybu
curl -X POST http://localhost:3000/api/chyby \
  -H "Content-Type: application/json" \
  -H "X-Chyby-API-Key: sk_chyby_2025_secure_key_..." \
  -d '{
    "typ": "Backend",
    "priorita": "Vysoká",
    "popis": "Server neodpovedá na požiadavky",
    "riesitel": "Ján Novák"
  }'
```

## 📡 API Endpoints

### `GET /health`
Kontrola stavu servera (bez autentifikácie)

### `GET /api/chyby`
Získa všetky chyby

### `GET /api/chyby/:id`
Získa konkrétnu chybu podľa ID

### `POST /api/chyby`
Vytvorí novú chybu
```json
{
  "typ": "Frontend",
  "priorita": "Stredná",
  "popis": "Button nefunguje na mobiloch",
  "riesitel": "Mária Nováková",
  "poznamky": "Len na iOS"
}
```

### `PUT /api/chyby/:id`
Aktualizuje existujúcu chybu
```json
{
  "stav": "V riešení",
  "poznamky": "Už pracujem na tom"
}
```

### `DELETE /api/chyby/:id`
Zmaže chybu

## 🔐 Autentifikácia

Všetky `/api/*` endpointy vyžadujú header:
```
X-Chyby-API-Key: sk_chyby_2025_secure_key_...
```

## 🌐 Railway Deployment

1. **Vytvor Railway projekt**
   ```bash
   # Pre Railway deployment konvertuj credentials na base64
   cat google_credentials.json | base64 | tr -d '\n' > base64_credentials.txt
   ```

2. **Nastav Environment Variables na Railway:**
   - `API_KEY` - tvoj API kľúč
   - `SPREADSHEET_ID` - ID Google Sheets
   - `GOOGLE_CREDENTIALS_BASE64` - obsah `base64_credentials.txt`

3. **Deploy**
   - Push na GitHub
   - Railway automaticky deployuje

4. **Uprav `openapi.yaml`**
   - Zmeň URL na tvoju Railway doménu

## 🤖 Vytvorenie ChatGPT GPT

1. Choď na https://chatgpt.com/gpts/editor
2. **Configuration:**
   - Name: "Zapisovač chyb"
   - Description: "Pomáham zaznamenávať a spravovať chyby v Google Sheets"
   - Instructions:
     ```
     Si asistent pre zapisovanie a správu chýb.
     
     Pravidlá:
     - Stručné a jasné odpovede
     - Pri vytváraní novej chyby sa vždy pýtaj na: typ, prioritu, popis
     - Automaticky zapisuj do Google Sheets cez API
     - Pri zobrazení chýb použi prehľadné formátovanie
     
     Typy chýb: Backend, Frontend, Databáza, UX/UI, Bezpečnosť, Iné
     Priority: Nízka, Stredná, Vysoká, Kritická
     Stavy: Nová, V riešení, Vyriešená, Zamietnutá
     ```

3. **Actions:**
   - Authentication: Custom Header
   - Header name: `X-Chyby-API-Key`
   - API Key: [tvoj API_KEY]
   - Schema: skopíruj obsah `openapi.yaml`

4. **Privacy Policy:**
   - URL: `https://raw.githubusercontent.com/[username]/[repo]/main/privacy_policy.md`

5. **Conversation starters:**
   ```
   📝 Zapíš novú chybu
   📋 Zobraz všetky chyby
   🔍 Nájdi chybu podľa ID
   ✅ Označ chybu ako vyriešenú
   ```

## 📊 Google Sheets štruktúra

Tabuľka by mala vyzerať takto:

| ID | Dátum | Typ | Priorita | Popis | Stav | Riešiteľ | Poznámky |
|----|-------|-----|----------|-------|------|----------|----------|
| CHYBA-0001 | 29.10.2025, 14:30 | Backend | Vysoká | Server crashuje | Nová | Ján Novák | Len na produkčnom serveri |
| CHYBA-0002 | 29.10.2025, 15:45 | Frontend | Stredná | Button nefunguje | V riešení | Mária K. | iOS Safari problém |

## 🔧 Troubleshooting

### "Unauthorized" chyba
- Skontroluj API_KEY v `.env`
- Skontroluj header názov: `X-Chyby-API-Key` (case-sensitive!)

### "Could not load credentials"
- Skontroluj či existuje `google_credentials.json`
- Skontroluj či je správne nastavený `GOOGLE_CREDENTIALS_PATH`
- Pre Railway: skontroluj `GOOGLE_CREDENTIALS_BASE64`

### Tabuľka nenájdená
- Skontroluj `SPREADSHEET_ID` v `.env`
- Skontroluj či je tabuľka zdieľaná so Service Account emailom

### "NOT_FOUND" v Google Sheets
- Skontroluj že názov sheet-u je `Sheet1` (alebo uprav v `server.js`)
- Skontroluj že prvý riadok obsahuje hlavičku

## 📚 Ďalšie informácie

Kompletný návod: `NAVOD_VYTVORENIE_GPT_AUTOMATIZACIE.md`

## 📝 License

MIT

