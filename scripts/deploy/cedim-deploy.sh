#!/bin/bash
# Implanta automaticamente a versão publicada na branch principal do PET-Cedim.
# Roda no CT 104 (cedim): compara o commit remoto com o que está implantado e, havendo novidade,
# refaz a imagem e sobe os contêineres. Se a nova versão não responder, volta para a anterior.
# Instalado em /usr/local/bin/cedim-deploy.sh (chmod 755). Configuração: /etc/cedim-deploy.env (chmod 600).
set -u
source /etc/cedim-deploy.env

RAIZ=/opt/cedim
COMPOSE="docker compose -f $RAIZ/docker-compose.prod.yml"
ESTADO=/var/lib/cedim-deploy
mkdir -p "$ESTADO"

log() { echo "[cedim-deploy] $*"; }

avisar() {
  [ -n "${TG_TOKEN:-}" ] && [ -n "${TG_CHAT:-}" ] || return 0
  curl -fsS -m 10 -o /dev/null "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TG_CHAT}" --data-urlencode "text=$1" || true
}

# Sobe os contêineres e espera a aplicação responder. Retorna 1 se não responder a tempo.
subir_e_conferir() {
  $COMPOSE up -d --build || return 1
  for _ in $(seq 1 40); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' -m 5 http://localhost:3000/login)" = "200" ] && return 0
    sleep 3
  done
  return 1
}

# Uma implantação por vez: o build pode passar do intervalo do timer.
exec 9> "$ESTADO/trava"
flock -n 9 || { log "implantação já em andamento; saindo"; exit 0; }

cd "$RAIZ" || { log "ERRO: $RAIZ não existe"; exit 1; }

# 1) Há commit novo? Consulta barata, sem baixar nada.
remoto=$(git ls-remote "$REPO_URL" "refs/heads/$BRANCH" | cut -f1)
[ -n "$remoto" ] || { log "ERRO: não foi possível consultar o repositório"; exit 1; }
atual=$(git rev-parse HEAD 2>/dev/null || echo "")

if [ "$remoto" = "$atual" ]; then
  log "sem novidade (${remoto:0:7})"
  exit 0
fi

log "versão nova: ${atual:0:7} -> ${remoto:0:7}"

# 2) Atualiza o código. O .env fica intacto: está no .gitignore, e reset --hard só mexe no que é rastreado.
if ! git fetch --quiet origin "$BRANCH" || ! git reset --hard --quiet "origin/$BRANCH"; then
  log "ERRO ao atualizar o código"
  avisar "🔴 CEDIM: falha ao baixar a versão ${remoto:0:7}. Nada foi alterado."
  exit 1
fi

# 3) Reconstrói e sobe.
if subir_e_conferir; then
  log "implantado com sucesso: ${remoto:0:7}"
  echo "$remoto" > "$ESTADO/implantado"
  docker image prune -f > /dev/null 2>&1    # o CT tem 16 GB; imagens antigas se acumulam
  avisar "🟢 CEDIM: versão ${remoto:0:7} no ar."
  exit 0
fi

# 4) A nova versão não respondeu: volta para a anterior.
log "ERRO: a versão ${remoto:0:7} não respondeu; revertendo para ${atual:0:7}"
avisar "🔴 CEDIM: a versão ${remoto:0:7} não subiu. Revertendo para ${atual:0:7}."

if [ -n "$atual" ] && git reset --hard --quiet "$atual" && subir_e_conferir; then
  log "revertido para ${atual:0:7}; o site voltou ao ar"
  avisar "🟡 CEDIM: revertido para ${atual:0:7}. O site está no ar na versão anterior."
else
  log "ERRO GRAVE: a reversão também falhou; o site está fora do ar"
  avisar "🔴 CEDIM: a reversão falhou. O SITE ESTÁ FORA DO AR — precisa de intervenção manual."
fi
exit 1
