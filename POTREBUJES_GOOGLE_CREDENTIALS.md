# 🚨 DÔLEŽITÉ UPOZORNENIE 🚨

## ❌ Server NEMÔŽE BEŽAŤ bez Google Service Account!

Potrebuješ najprv vytvoriť Google Service Account credentials!

---

## 📝 Čo musíš urobiť (5 minút):

### 1️⃣ Vytvor Google Service Account

1. **Choď na:** https://console.cloud.google.com
2. **Zapni Google Sheets API:**
   - API & Services → Library
   - Vyhľadaj "Google Sheets API"
   - Enable

3. **Vytvor Service Account:**
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Meno: `adsun-chyby-service`
   - Role: **Editor**
   - Done

4. **Vytvor JSON kľúč:**
   - Klikni na vytvorený service account
   - Keys → Add Key → Create new key
   - Type: **JSON**
   - Create
   - Stiahne sa súbor `xxx.json`

5. **Premenuj súbor:**
   ```bash
   # Premiestni stiahnutý súbor sem a premenuj:
   mv ~/Downloads/[názov-súboru].json "/Users/polepime.sk/Documents/cursor_workspace/zapis chyb GPTs/google_credentials.json"
   ```

### 2️⃣ Zdieľaj Google Sheets

1. **Otvor tvoju tabuľku:**
   https://docs.google.com/spreadsheets/d/1DBWPZ90yd6tk6YZbz5AC7aju582SSguD/edit

2. **Share:**
   - Klikni "Share" (vpravo hore)
   - Pridaj **email z JSON súboru** (nájdeš ho v poli `client_email`)
   - Role: **Editor**
   - Share

### 3️⃣ Spusti server

Po vytvorení `google_credentials.json` spusti:
```bash
npm start
```

---

## 🆘 Ak už máš Google Service Account:

Jednoducho ulož JSON súbor ako:
```
/Users/polepime.sk/Documents/cursor_workspace/zapis chyb GPTs/google_credentials.json
```

A spusti `npm start`

---

## 📚 Kompletný návod:
Pozri: `NAVOD_VYTVORENIE_GPT_AUTOMATIZACIE.md` (sekcia "KROK 2: Nastavenie Google Cloud API")

