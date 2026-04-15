#!/bin/bash

DATE=$(date +"%Y-%m-%d")
SESSION_FILE="sessions/SESSION-${DATE}.md"

# Créer le dossier sessions si nécessaire
mkdir -p sessions

# Copier le template
cp SESSION.md "$SESSION_FILE"

# Remplacer la date
sed -i '' "s/{{DATE}}/${DATE}/g" "$SESSION_FILE"

echo "✅ Nouvelle session créée: $SESSION_FILE"
echo "📝 Ouvre ce fichier et décris ton objectif"
