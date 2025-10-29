# 🎯 RÝCHLY ŠTART - Zapisovanie chyb GPT

## ✅ Čo máš už pripravené:
- ✅ Google Sheets tabuľka: `Log_chýb` s komplexnou štruktúrou
- ✅ SPREADSHEET_ID: `1DBWPZ90yd6tk6YZbz5AC7aju582SSguD`

## 📝 Čo ešte musíš urobiť:

### 1️⃣ Skopíruj `.env` súbor (2 min)

```bash
cd "/Users/polepime.sk/Documents/cursor_workspace/zapis chyb GPTs"
cp env.example .env
```

Súbor `.env` už obsahuje správne SPREADSHEET_ID! Potrebuješ len:
- Zmeniť `API_KEY` na tvoj vlastný (vygeneruj si silný random string)

### 2️⃣ Google Service Account (5 min)

1. **Choď na:** https://console.cloud.google.com
2. **Vytvor Service Account:**
   - IAM & Admin → Service Accounts → Create Service Account
   - Meno: `adsun-chyby-service`
   - Role: **Editor**
3. **Vytvor JSON kľúč:**
   - Klikni na service account → Keys → Add Key → Create new key → JSON
   - Stiahne sa súbor `xxx.json`
   - **Premenuj na `google_credentials.json`** a ulož do tohto priečinka

4. **DÔLEŽITÉ - Zdieľaj Google Sheets:**
   - Otvor tvoju tabuľku: https://docs.google.com/spreadsheets/d/1DBWPZ90yd6tk6YZbz5AC7aju582SSguD/edit
   - Klikni **Share** (vpravo hore)
   - Pridaj **email z JSON súboru** (client_email)
   - Role: **Editor**
   - Share

### 3️⃣ Nainštaluj a spusti (2 min)

```bash
# Nainštaluj dependencies
npm install

# Spusti server
npm start
```

Server beží na: http://localhost:3000

### 4️⃣ Test (1 min)

```bash
# Health check
curl http://localhost:3000/health

# Získaj všetky chyby (zmeň API_KEY na tvoj)
curl http://localhost:3000/api/chyby \
  -H "X-Chyby-API-Key: sk_chyby_2025_secure_key_a8f3j2k9x4m7p1q5"
```

Ak vidíš chyby z tabuľky = **FUNGUJE!** ✅

---

## 🌐 Railway Deployment (10 min)

### 1. Priprav credentials pre Railway

```bash
cat google_credentials.json | base64 | tr -d '\n' > base64_credentials.txt
```

### 2. GitHub

```bash
git init
git add .
git commit -m "Initial commit - ADSUN Log chýb"
git remote add origin https://github.com/[tvoj-username]/adsun-log-chyb.git
git push -u origin main
```

### 3. Railway

1. https://railway.app → New Project → Deploy from GitHub
2. Vyber svoj repo
3. **Environment Variables:**
   - `API_KEY` = [tvoj_api_key]
   - `SPREADSHEET_ID` = `1DBWPZ90yd6tk6YZbz5AC7aju582SSguD`
   - `GOOGLE_CREDENTIALS_BASE64` = [obsah base64_credentials.txt]
4. Generate Domain → Poznač si URL
5. **Aktualizuj `openapi.yaml`** - zmeň URL na tvoju Railway doménu

---

## 🤖 ChatGPT GPT (15 min)

### 1. Vytvor GPT
https://chatgpt.com/gpts/editor → Create

### 2. Configuration

**Name:** Zapisovač chýb ADSUN

**Description:** Asistent pre zapisovanie a analýzu výrobných chýb do Google Sheets

**Instructions:**
```
Si profesionálny asistent pre dokumentáciu výrobných chýb spoločnosti ADSUN.

TVOJA ÚLOHA:
- Pomáhať zapisovať chyby do systému s kompletnou dokumentáciou
- Viesť používateľa 5x PREČO analýzou pre identifikáciu príčin
- Navrhovať preventívne opatrenia
- Analyzovať trendy a štatistiky chýb

PRI VYTVÁRANÍ NOVEJ CHYBY:
1. Opýtaj sa na základné info: Čo sa stalo? Ktorá zákazka? (ID?)
2. Zisti fázu a typ chyby
3. Urči závažnosť (S1-Kritická až S4-Nízka)
4. Veď 5x PREČO analýzu: 
   - Prečo sa to stalo? 
   - A prečo to? 
   - A prečo to? 
   (až po root cause)
5. Spýtaj sa na okamžité riešenie
6. Navrhni preventívne opatrenie
7. Zisti kto je zodpovedný a kto to nahlásil

TYPY CHÝB: Komunikácia, Proces, Technická, Materiál, Ľudská chyba
FÁZY: Výroba, Inštalácia, Príprava, Design, Dokončenie
ZÁVAŽNOSTI: S1-Kritická, S2-Vysoká, S3-Stredná, S4-Nízka
STAVY: Nová, V riešení, Uzavretá, Sledovanie

TVOJT ÓN:
- Profesionálny, ale priateľský
- Stručný a presný
- V slovenčine
- Pri zobrazení chýb použi prehľadné tabuľky/formátovanie
```

**Conversation starters:**
```
📝 Zapísať novú chybu
📊 Ukáž štatistiky chýb
🔍 Chyby pre zákazku Z251293
📋 Zobraz všetky kritické chyby
```

### 3. Actions

1. **Edit actions** → **Authentication:**
   - Type: **Custom**
   - Custom Header Name: `X-Chyby-API-Key`
   - API Key: `[tvoj_api_key_z_.env]`

2. **Schema:** Skopíruj celý obsah `openapi.yaml`

3. **Privacy:**
   - URL: `https://raw.githubusercontent.com/[username]/[repo]/main/privacy_policy.md`

### 4. Publish
**Update** → **Share** → **Anyone with the link**

---

## 🎯 Hotovo!

Teraz môžeš v ChatGPT písať:
- "Zapíš novú chybu na zákazke Z251293"
- "Ukáž mi všetky chyby z výroby"
- "Aké sú štatistiky za tento mesiac?"

---

## 📊 API Endpointy

| Endpoint | Popis |
|----------|-------|
| `GET /api/chyby` | Všetky chyby |
| `GET /api/chyby/zakazka/Z251293` | Chyby pre zákazku |
| `GET /api/chyby/stats` | Štatistiky |
| `POST /api/chyby` | Nová chyba |
| `PUT /api/chyby` | Aktualizuj chybu |

---

## 🆘 Problémy?

**"Unauthorized"**
- Skontroluj API_KEY v `.env` a v GPT Actions

**"Could not load credentials"**
- Skontroluj že `google_credentials.json` existuje
- Pre Railway: skontroluj `GOOGLE_CREDENTIALS_BASE64`

**"NOT_FOUND" tabuľka**
- Skontroluj že sheet sa volá `Log_chýb` (nie `Sheet1`)
- Skontroluj že tabuľka je zdieľaná so Service Account emailom

**Tabuľka je prázdna**
- API funguje! Vytvor prvú chybu cez GPT agenta

---

## 📚 Kompletný návod
Pozri: `NAVOD_VYTVORENIE_GPT_AUTOMATIZACIE.md`

