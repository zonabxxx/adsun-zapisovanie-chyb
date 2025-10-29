# 🚀 Kompletný návod: Vytvorenie GPT automatizácie s Google Sheets

## 📋 Prehľad
Tento návod ti ukáže ako vytvoriť ChatGPT agenta ktorý pracuje s tvojou Google Sheets tabuľkou.

---

## KROK 1: Príprava Google Sheets tabuľky

### 1.1 Vytvor Google Sheets
1. Choď na https://sheets.google.com
2. Vytvor novú tabuľku
3. Pomenuj ju (napr. "Zákazky", "Produkty", atď.)
4. Vytvor stĺpce podľa tvojich potrieb

### 1.2 Poznač si Spreadsheet ID
Z URL tabuľky:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```
Skopíruj `SPREADSHEET_ID` - budeš ho potrebovať!

---

## KROK 2: Nastavenie Google Cloud API

### 2.1 Vytvor Google Cloud projekt
1. Choď na https://console.cloud.google.com
2. Vytvor nový projekt (alebo použi existujúci)
3. Zapni **Google Sheets API**:
   - API & Services → Library
   - Vyhľadaj "Google Sheets API"
   - Enable

### 2.2 Vytvor Service Account
1. **IAM & Admin** → **Service Accounts**
2. **Create Service Account**
3. Meno: `[tvoj-projekt]-service`
4. Role: **Editor**
5. **Done**

### 2.3 Vytvor JSON kľúč
1. Klikni na vytvorený Service Account
2. **Keys** tab → **Add Key** → **Create new key**
3. Type: **JSON**
4. **Create** - stiahne sa súbor `xxx.json`

### 2.4 Zdieľaj Google Sheets
1. Otvor tvoju Google Sheets tabuľku
2. **Share** (vpravo hore)
3. Pridaj **email Service Accountu** (z JSON - `client_email`)
4. Role: **Editor**
5. **Share**

---

## KROK 3: Príprava kódu (lokálne)

### 3.1 Vytvor projekt

```bash
mkdir moja-gpt-automatizacia
cd moja-gpt-automatizacia
npm init -y
npm install express cors googleapis dotenv
```

### 3.2 Vytvor `.env` súbor

```env
PORT=3000
API_KEY=sk_moj_projekt_2025_secure_key_[random_string]
SPREADSHEET_ID=[tvoj_spreadsheet_id]
GOOGLE_CREDENTIALS_PATH=./google_credentials.json
```

### 3.3 Skopíruj `google_credentials.json`
Premiestni stiahnutý JSON súbor do projektového priečinka ako `google_credentials.json`.

### 3.4 Vytvor `server.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Key autentifikácia
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-moj-api-key']; // Zmeň názov
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      status: 'ERROR',
      message: 'unauthorized'
    });
  }
  
  next();
};

// Google Sheets setup
const getGoogleSheetsClient = async () => {
  try {
    let credentials;
    
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
      const credString = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
      credentials = JSON.parse(credString);
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
    } else if (process.env.GOOGLE_CREDENTIALS) {
      let credString = process.env.GOOGLE_CREDENTIALS;
      if (!credString.trim().startsWith('{')) {
        credString = Buffer.from(credString, 'base64').toString('utf8');
      }
      credentials = JSON.parse(credString);
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: credentials || undefined,
      keyFile: credentials ? undefined : (process.env.GOOGLE_CREDENTIALS_PATH || './google_credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    return sheets;
  } catch (error) {
    console.error('Chyba pri inicializácii Google Sheets:', error);
    throw error;
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server beží',
    api_key: process.env.API_KEY ? '✓ nastavený' : '✗ CHÝBA',
    spreadsheet_id: process.env.SPREADSHEET_ID ? '✓ nastavený' : '✗ CHÝBA'
  });
});

// GET všetky záznamy
app.get('/api/items', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Načítaj dáta (upraviť rozsah podľa tvojej tabuľky)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:Z', // Upraviť podľa potreby
    });
    
    const rows = response.data.values || [];
    
    // Transformuj do objektov (upraviť podľa stĺpcov)
    const items = rows.map(row => ({
      id: row[0],
      nazov: row[1],
      popis: row[2],
      // ... ďalšie stĺpce
    }));
    
    res.json({
      status: 'OK',
      data: items
    });
  } catch (error) {
    console.error('Chyba:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'internal_error',
      details: error.message
    });
  }
});

// POST nový záznam
app.post('/api/items', authenticateApiKey, async (req, res) => {
  try {
    const { id, nazov, popis } = req.body; // Upraviť podľa potreby
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Pridaj riadok
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, nazov, popis]] // Upraviť podľa stĺpcov
      }
    });
    
    res.json({
      status: 'OK',
      item_id: id
    });
  } catch (error) {
    console.error('Chyba:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'internal_error',
      details: error.message
    });
  }
});

// Spusti server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server beží na http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${process.env.API_KEY ? '✓ nastavený' : '✗ CHÝBA!'}`);
  console.log(`📄 Spreadsheet ID: ${process.env.SPREADSHEET_ID ? '✓ nastavený' : '✗ CHÝBA!'}`);
});

module.exports = app;
```

### 3.5 Vytvor `package.json` scripts

```json
{
  "name": "moja-gpt-automatizacia",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "googleapis": "^128.0.0",
    "dotenv": "^16.3.1"
  }
}
```

### 3.6 Testuj lokálne

```bash
node server.js
# Server by mal bežať na http://localhost:3000

# Test v inom termináli:
curl http://localhost:3000/health
```

---

## KROK 4: Git a GitHub

### 4.1 Vytvor `.gitignore`

```
node_modules/
.env
google_credentials.json
*.log
.DS_Store
```

### 4.2 Inicializuj Git

```bash
git init
git add .
git commit -m "Initial commit"
```

### 4.3 Vytvor GitHub repo
1. GitHub.com → New repository
2. Meno: `moja-gpt-automatizacia`
3. **Public** (pre privacy policy)
4. Create

### 4.4 Push na GitHub

```bash
git remote add origin https://github.com/[tvoj-username]/moja-gpt-automatizacia.git
git branch -M main
git push -u origin main
```

---

## KROK 5: Railway Deployment

### 5.1 Vytvor Railway účet
1. https://railway.app
2. Sign up cez GitHub

### 5.2 Vytvor Base64 z Google Credentials

```bash
cat google_credentials.json | base64 | tr -d '\n' > base64_credentials.txt
```

### 5.3 Deploy na Railway
1. **New Project**
2. **Deploy from GitHub repo**
3. Vyber svoj repo
4. Počkaj na build

### 5.4 Nastav Environment Variables
V Railway → Variables tab, pridaj:

**API_KEY:**
```
sk_moj_projekt_2025_secure_key_[random_string]
```

**SPREADSHEET_ID:**
```
[tvoj_spreadsheet_id]
```

**GOOGLE_CREDENTIALS_BASE64:**
```
[obsah base64_credentials.txt]
```

### 5.5 Generate Domain
Railway → Settings → Networking → **Generate Domain**

Poznač si URL (napr. `https://moja-app-production.up.railway.app`)

### 5.6 Trigger Redeploy
Railway → Deployments → **Deploy** (aby načítal env variables)

### 5.7 Testuj Railway

```bash
curl https://moja-app-production.up.railway.app/health
```

Mal by vrátiť:
```json
{
  "status": "OK",
  "message": "Server beží",
  "api_key": "✓ nastavený",
  "spreadsheet_id": "✓ nastavený"
}
```

---

## KROK 6: Privacy Policy

### 6.1 Vytvor `privacy_policy.md`

```markdown
# Privacy Policy - [Názov tvojho GPT]

**Last Updated:** [Dátum]

## Overview
[Tvoj GPT] pomáha spravovať [čo robí] cez Google Sheets.

## Information We Collect
- [Typ dát]
- [Typ dát]

## How We Use Your Information
- Len pre účely [čo robí]
- Dáta sú uložené v tvojej Google Sheets

## Data Sharing
Nezdieľame dáta s tretími stranami.

## Contact
Email: [tvoj-email]
```

### 6.2 Commitni a pushni

```bash
git add privacy_policy.md
git commit -m "Add privacy policy"
git push
```

---

## KROK 7: OpenAPI Schema

### 7.1 Vytvor `openapi.yaml`

```yaml
openapi: 3.1.0
info:
  title: [Názov API]
  description: API pre [účel]
  version: 1.0.0
servers:
  - url: https://[tvoja-railway-url].up.railway.app
    description: Production Server

paths:
  /api/items:
    get:
      operationId: getAllItems
      summary: Získa všetky položky
      security:
        - ApiKeyAuth: []
      responses:
        '200':
          description: Zoznam položiek
    
    post:
      operationId: createItem
      summary: Vytvorí novú položku
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - id
                - nazov
              properties:
                id:
                  type: string
                nazov:
                  type: string
                popis:
                  type: string
      responses:
        '200':
          description: Položka vytvorená

components:
  schemas: {}
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-Moj-API-Key
```

---

## KROK 8: Vytvorenie ChatGPT GPT

### 8.1 Vytvor GPT
1. https://chatgpt.com/gpts/editor
2. **Create**

### 8.2 Configure
- **Name:** [Názov tvojho GPT]
- **Description:** [Čo robí]
- **Instructions:** 
  ```
  Si asistent pre [účel].
  
  Pravidlá:
  - Stručné odpovede
  - Používaj slovenčinu
  - Pri zmenách volaj API
  ```
- **Conversation starters:**
  ```
  Zobraz mi všetky položky
  Pridaj novú položku
  Uprav položku XYZ
  ```

### 8.3 Actions
1. **Edit actions**
2. **Authentication:**
   - Auth Type: **Custom**
   - Custom Header Name: `X-Moj-API-Key`
   - API Key: `[tvoj_api_key]`
3. **Schema:** Vlož obsah `openapi.yaml`

### 8.4 Privacy Policy
1. **Share** → **Anyone with the link**
2. Klikni "here" pri "Click here to update"
3. **Privacy policy URL:**
   ```
   https://raw.githubusercontent.com/[username]/[repo]/main/privacy_policy.md
   ```

### 8.5 Publish
**Update** → **Share** → Skopíruj link

---

## KROK 9: Testovanie

### 9.1 Test v ChatGPT
```
Zobraz mi všetky položky
```

### 9.2 Test cez curl

```bash
# GET všetky položky
curl -X GET "https://[tvoja-url]/api/items" \
  -H "X-Moj-API-Key: [tvoj_api_key]"

# POST nová položka
curl -X POST "https://[tvoja-url]/api/items" \
  -H "Content-Type: application/json" \
  -H "X-Moj-API-Key: [tvoj_api_key]" \
  -d '{
    "id": "TEST-001",
    "nazov": "Test",
    "popis": "Test položka"
  }'
```

---

## 📚 Checklist

- [ ] Google Sheets vytvorená a zdieľaná
- [ ] Google Cloud Service Account vytvorený
- [ ] Lokálny server funguje
- [ ] GitHub repo vytvorené (public)
- [ ] Railway deployment úspešný
- [ ] Environment variables nastavené
- [ ] Railway URL funguje
- [ ] Privacy Policy nahratá
- [ ] OpenAPI schema vytvorená
- [ ] ChatGPT GPT vytvorený
- [ ] Actions nakonfigurované
- [ ] GPT otestovaný a funguje

---

## 🔧 Troubleshooting

### Railway NEVIDÍ environment variables:
- Trigger redeploy cez Deployments tab
- Skontroluj či sú variables pre Production environment

### "Unauthorized" error:
- Skontroluj API key v Railway variables
- Skontroluj Authentication v GPT Actions
- Skontroluj header name (case-sensitive!)

### "Could not load credentials":
- Skontroluj `GOOGLE_CREDENTIALS_BASE64` v Railway
- Musí byť kompletný base64 string (žiadne newlines!)

### "NOT_FOUND" na Railway:
- Railway musí načítať nový kód po pridaní variables
- Sprav git commit + push na trigger nového deployu

---

## 💡 Tipy

1. **Bezpečnosť:** Nikdy necommituj `.env` ani `google_credentials.json`!
2. **API Key:** Použ silný random string
3. **Google Sheets:** Stĺpce by mali mať jasné názvy
4. **Railway:** Free tier má limity - sleduj usage
5. **OpenAPI:** Ak zmeníš API, aktualizuj aj OpenAPI schema v GPT

---

## 🎯 Príklady použitia

**Zákazky:**
- Sledovanie objednávok
- Statusy zákaziek
- Priraďovanie pracovníkov

**Produkty:**
- Inventár skladom
- Ceny produktov
- Dodávatelia

**Kontakty:**
- CRM systém
- Sledovanie komunikácie
- Remindery

**Úlohy:**
- Task management
- Deadline tracking
- Priraďovanie tímu

---

**Hotovo! Teraz môžeš vytvoriť ďalšie GPT automatizácie podľa tohto návodu.** 🚀

