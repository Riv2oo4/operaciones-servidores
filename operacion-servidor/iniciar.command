#!/bin/bash
# Doble clic para iniciar el servidor del taller
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Falta instalar Node.js: https://nodejs.org (versión LTS)"
  read -p "Presiona Enter para cerrar..."
  exit 1
fi
node server.js
