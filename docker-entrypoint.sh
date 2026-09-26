#!/bin/sh
set -e

echo "[entrypoint] conferindo o ambiente..."
node scripts/verificar-ambiente.js

echo "[entrypoint] aguardando o banco de dados e aplicando migrations..."
i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint] o banco não respondeu após 30 tentativas" >&2
    exit 1
  fi
  echo "[entrypoint] tentativa $i falhou; nova tentativa em 3s..."
  sleep 3
done

echo "[entrypoint] aplicando seed (idempotente)..."
node prisma/seed.js

echo "[entrypoint] iniciando a aplicação..."
exec "$@"
