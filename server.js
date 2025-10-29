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
  const apiKey = req.headers['x-chyby-api-key'];
  
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
    
    // Railway deployment - base64 encoded credentials
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
      const credString = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8');
      credentials = JSON.parse(credString);
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
    } 
    // Alternative: JSON string credentials
    else if (process.env.GOOGLE_CREDENTIALS) {
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
    console.error('❌ Chyba pri inicializácii Google Sheets:', error);
    throw error;
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server beží',
    service: 'Zapisovanie chyb GPT',
    api_key: process.env.API_KEY ? '✓ nastavený' : '✗ CHÝBA',
    spreadsheet_id: process.env.SPREADSHEET_ID ? '✓ nastavený' : '✗ CHÝBA',
    timestamp: new Date().toISOString()
  });
});

// GET všetky chyby
app.get('/api/chyby', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Načítaj dáta z Google Sheets (od 2. riadku, prvý je hlavička)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:S', // Prvý sheet, všetky stĺpce
    });
    
    const rows = response.data.values || [];
    
    // Transformuj do objektov
    const chyby = rows
      .filter(row => row[0]) // Len riadky s timestamp
      .map((row, index) => ({
        timestamp: row[0] || '',
        klient: row[1] || '',
        zakazka_id: row[2] || '',
        nazov_zakazky: row[3] || '',
        faza: row[4] || '',
        typ_chyby: row[5] || '',
        zavaznost: row[6] || '',
        popis_problemu: row[7] || '',
        pricina: row[8] || '',
        okamzite_opatrenie: row[9] || '',
        preventivne_opatrenie: row[10] || '',
        zodpovedny: row[11] || '',
        nahlasil: row[12] || '',
        stav: row[13] || '',
        follow_up_datum: row[14] || '',
        odhad_naklad: row[15] || '',
        strata_casu: row[16] || '',
        dokaz_link: row[17] || '',
        tagy: row[18] || ''
      }));
    
    res.json({
      status: 'OK',
      count: chyby.length,
      data: chyby
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'internal_error',
      details: error.message
    });
  }
});

// GET chyby pre konkrétnu zákazku
app.get('/api/chyby/zakazka/:zakazka_id', authenticateApiKey, async (req, res) => {
  try {
    const { zakazka_id } = req.params;
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:S',
    });
    
    const rows = response.data.values || [];
    const filteredRows = rows.filter(r => r[2] === zakazka_id); // C = Zákazka_ID
    
    if (filteredRows.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'not_found',
        details: `Žiadne chyby pre zákazku ${zakazka_id}`
      });
    }
    
    const chyby = filteredRows.map(row => ({
      timestamp: row[0],
      klient: row[1],
      zakazka_id: row[2],
      nazov_zakazky: row[3],
      faza: row[4],
      typ_chyby: row[5],
      zavaznost: row[6],
      popis_problemu: row[7],
      pricina: row[8],
      okamzite_opatrenie: row[9],
      preventivne_opatrenie: row[10],
      zodpovedny: row[11],
      nahlasil: row[12],
      stav: row[13],
      follow_up_datum: row[14],
      odhad_naklad: row[15],
      strata_casu: row[16],
      dokaz_link: row[17],
      tagy: row[18]
    }));
    
    res.json({
      status: 'OK',
      count: chyby.length,
      data: chyby
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'internal_error',
      details: error.message
    });
  }
});

// POST nová chyba
app.post('/api/chyby', authenticateApiKey, async (req, res) => {
  try {
    const {
      klient,
      zakazka_id,
      nazov_zakazky,
      faza,
      typ_chyby,
      zavaznost,
      popis_problemu,
      pricina,
      okamzite_opatrenie,
      preventivne_opatrenie,
      zodpovedny,
      nahlasil,
      stav,
      follow_up_datum,
      odhad_naklad,
      strata_casu,
      dokaz_link,
      tagy
    } = req.body;
    
    // Validácia povinných polí
    if (!popis_problemu) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'bad_request',
        details: 'Pole "popis_problemu" je povinné'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Aktuálny dátum a čas v ISO formáte
    const timestamp = new Date().toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Pridaj riadok do tabuľky
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:S',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          timestamp,
          klient || '',
          zakazka_id || '',
          nazov_zakazky || '',
          faza || '',
          typ_chyby || '',
          zavaznost || '',
          popis_problemu,
          pricina || '',
          okamzite_opatrenie || '',
          preventivne_opatrenie || '',
          zodpovedny || '',
          nahlasil || '',
          stav || 'Nová',
          follow_up_datum || '',
          odhad_naklad || '',
          strata_casu || '',
          dokaz_link || '',
          tagy || ''
        ]]
      }
    });
    
    res.json({
      status: 'OK',
      message: 'Chyba vytvorená',
      data: {
        timestamp,
        klient,
        zakazka_id,
        nazov_zakazky,
        faza,
        typ_chyby,
        zavaznost,
        popis_problemu,
        pricina,
        okamzite_opatrenie,
        preventivne_opatrenie,
        zodpovedny,
        nahlasil,
        stav: stav || 'Nová',
        follow_up_datum,
        odhad_naklad,
        strata_casu,
        dokaz_link,
        tagy
      }
    });
  } catch (error) {
    console.error('❌ Chyba pri vytváraní:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'internal_error',
      details: error.message
    });
  }
});

// PUT aktualizácia chyby (podľa zákazka_id a timestamp)
app.put('/api/chyby', authenticateApiKey, async (req, res) => {
  try {
    const { zakazka_id, timestamp, ...updates } = req.body;
    
    if (!zakazka_id || !timestamp) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'bad_request',
        details: 'Polia "zakazka_id" a "timestamp" sú povinné pre identifikáciu záznamu'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    // Nájdi riadok podľa zákazka_id a timestamp
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:S',
    });
    
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(r => r[2] === zakazka_id && r[0] === timestamp);
    
    if (rowIndex === -1) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'not_found',
        details: `Chyba so zákazkou ${zakazka_id} a timestampom ${timestamp} nebola nájdená`
      });
    }
    
    const actualRowNumber = rowIndex + 2;
    const existingRow = rows[rowIndex];
    
    // Update len poskytnuté hodnoty
    const updatedRow = [
      existingRow[0], // timestamp sa nemení
      updates.klient !== undefined ? updates.klient : existingRow[1],
      existingRow[2], // zakazka_id sa nemení
      updates.nazov_zakazky !== undefined ? updates.nazov_zakazky : existingRow[3],
      updates.faza !== undefined ? updates.faza : existingRow[4],
      updates.typ_chyby !== undefined ? updates.typ_chyby : existingRow[5],
      updates.zavaznost !== undefined ? updates.zavaznost : existingRow[6],
      updates.popis_problemu !== undefined ? updates.popis_problemu : existingRow[7],
      updates.pricina !== undefined ? updates.pricina : existingRow[8],
      updates.okamzite_opatrenie !== undefined ? updates.okamzite_opatrenie : existingRow[9],
      updates.preventivne_opatrenie !== undefined ? updates.preventivne_opatrenie : existingRow[10],
      updates.zodpovedny !== undefined ? updates.zodpovedny : existingRow[11],
      updates.nahlasil !== undefined ? updates.nahlasil : existingRow[12],
      updates.stav !== undefined ? updates.stav : existingRow[13],
      updates.follow_up_datum !== undefined ? updates.follow_up_datum : existingRow[14],
      updates.odhad_naklad !== undefined ? updates.odhad_naklad : existingRow[15],
      updates.strata_casu !== undefined ? updates.strata_casu : existingRow[16],
      updates.dokaz_link !== undefined ? updates.dokaz_link : existingRow[17],
      updates.tagy !== undefined ? updates.tagy : existingRow[18]
    ];
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Log_chýb!A${actualRowNumber}:S${actualRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });
    
    res.json({
      status: 'OK',
      message: 'Chyba aktualizovaná',
      data: {
        timestamp: updatedRow[0],
        klient: updatedRow[1],
        zakazka_id: updatedRow[2],
        nazov_zakazky: updatedRow[3],
        faza: updatedRow[4],
        typ_chyby: updatedRow[5],
        zavaznost: updatedRow[6],
        popis_problemu: updatedRow[7],
        pricina: updatedRow[8],
        okamzite_opatrenie: updatedRow[9],
        preventivne_opatrenie: updatedRow[10],
        zodpovedny: updatedRow[11],
        nahlasil: updatedRow[12],
        stav: updatedRow[13],
        follow_up_datum: updatedRow[14],
        odhad_naklad: updatedRow[15],
        strata_casu: updatedRow[16],
        dokaz_link: updatedRow[17],
        tagy: updatedRow[18]
      }
    });
  } catch (error) {
    console.error('❌ Chyba pri aktualizácii:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'internal_error',
      details: error.message
    });
  }
});

// GET štatistiky
app.get('/api/chyby/stats', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:S',
    });
    
    const rows = response.data.values || [];
    const chyby = rows.filter(r => r[0]); // Len riadky s timestamp
    
    // Počítanie štatistík
    const stats = {
      total: chyby.length,
      podla_zavaznosti: {},
      podla_stavu: {},
      podla_typu: {},
      podla_fazy: {},
      celkovy_odhad_naklad: 0,
      celkova_strata_casu: 0
    };
    
    chyby.forEach(row => {
      // Závažnosť
      const zavaznost = row[6] || 'Neurčená';
      stats.podla_zavaznosti[zavaznost] = (stats.podla_zavaznosti[zavaznost] || 0) + 1;
      
      // Stav
      const stav = row[13] || 'Neurčený';
      stats.podla_stavu[stav] = (stats.podla_stavu[stav] || 0) + 1;
      
      // Typ chyby
      const typ = row[5] || 'Neurčený';
      stats.podla_typu[typ] = (stats.podla_typu[typ] || 0) + 1;
      
      // Fáza
      const faza = row[4] || 'Neurčená';
      stats.podla_fazy[faza] = (stats.podla_fazy[faza] || 0) + 1;
      
      // Náklady a čas
      const naklad = parseFloat(row[15]) || 0;
      const cas = parseFloat(row[16]) || 0;
      stats.celkovy_odhad_naklad += naklad;
      stats.celkova_strata_casu += cas;
    });
    
    res.json({
      status: 'OK',
      data: stats
    });
  } catch (error) {
    console.error('❌ Chyba pri načítaní štatistík:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'internal_error',
      details: error.message
    });
  }
});

// Spusti server
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Server "Zapisovanie chyb GPT" beží`);
  console.log(`📍 HOST: ${HOST}:${PORT}`);
  console.log(`🔑 API Key: ${process.env.API_KEY ? '✓ nastavený' : '✗ CHÝBA!'}`);
  console.log(`📄 Spreadsheet ID: ${process.env.SPREADSHEET_ID ? '✓ nastavený' : '✗ CHÝBA!'}`);
  console.log(`${'='.repeat(50)}\n`);
});

module.exports = app;

