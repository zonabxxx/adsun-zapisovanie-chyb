#!/bin/bash

echo ""
echo "🔧 ADSUN - Zapisovanie chýb GPT - Setup Helper"
echo "=============================================="
echo ""

# Check if google_credentials.json exists
if [ -f "google_credentials.json" ]; then
    echo "✅ google_credentials.json - EXISTUJE"
    echo ""
    echo "🚀 Spúšťam server..."
    npm start
else
    echo "❌ google_credentials.json - CHÝBA"
    echo ""
    echo "📝 Potrebuješ vytvoriť Google Service Account:"
    echo ""
    echo "1️⃣  Choď na: https://console.cloud.google.com"
    echo "2️⃣  Zapni: Google Sheets API"
    echo "3️⃣  Vytvor: Service Account"
    echo "4️⃣  Stiahni: JSON kľúč"
    echo "5️⃣  Premenuj na: google_credentials.json"
    echo "6️⃣  Ulož sem: $(pwd)"
    echo ""
    echo "📚 Kompletný návod: NAVOD_VYTVORENIE_GPT_AUTOMATIZACIE.md"
    echo ""
    echo "❓ Máš už JSON súbor stiahnutý? (y/n)"
    read -r response
    
    if [ "$response" = "y" ]; then
        echo ""
        echo "📂 Skopíruj cestu k JSON súboru (napr. ~/Downloads/moj-projekt-xxx.json):"
        read -r json_path
        
        # Expand tilde
        json_path="${json_path/#\~/$HOME}"
        
        if [ -f "$json_path" ]; then
            cp "$json_path" "google_credentials.json"
            echo "✅ Súbor skopírovaný!"
            echo ""
            echo "🚀 Spúšťam server..."
            npm start
        else
            echo "❌ Súbor nenájdený: $json_path"
            exit 1
        fi
    else
        echo ""
        echo "👉 Po vytvorení JSON súboru spusti znova: ./setup.sh"
        echo ""
    fi
fi

