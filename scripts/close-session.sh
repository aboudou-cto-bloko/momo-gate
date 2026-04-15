#!/bin/bash

DATE=$(date +"%Y-%m-%d")
SESSION_FILE="sessions/SESSION-${DATE}.md"

if [ ! -f "$SESSION_FILE" ]; then
    echo "❌ Pas de session active pour aujourd'hui"
    exit 1
fi

echo "📋 Session à clôturer: $SESSION_FILE"
echo ""
echo "⚠️  Avant de clôturer:"
echo "1. Vérifie que les conclusions sont remplies dans SESSION.md"
echo "2. Copie manuellement les conclusions pertinentes dans CLAUDE.md"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Archiver la session
    mv "$SESSION_FILE" "sessions/archive/"
    mkdir -p sessions/archive
    echo "✅ Session archivée dans sessions/archive/"
    
    # Mettre à jour la date dans CLAUDE.md
    sed -i '' "s/Dernière mise à jour : .*/Dernière mise à jour : ${DATE}/g" CLAUDE.md
    echo "✅ CLAUDE.md mis à jour"
fi
