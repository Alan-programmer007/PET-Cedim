#!/bin/bash
# Autoteste de scripts/verificar-documentacao.sh.
#
# Monta um repositório git temporário, encena cada situação e confere o resultado.
# Roda igual em macOS, Linux e Windows (Git Bash) — é isso que o job "portabilidade"
# do GitHub Actions executa nos três sistemas.
#
#     bash scripts/testar-verificacao.sh     (ou: npm run docs:test)
set -u

RAIZ=$(cd "$(dirname "$0")/.." && pwd)
VERIFICADOR="$RAIZ/scripts/verificar-documentacao.sh"
[ -f "$VERIFICADOR" ] || { echo "não encontrei $VERIFICADOR"; exit 1; }

TMP=$(mktemp -d 2>/dev/null || mktemp -d -t docscheck)
trap 'rm -rf "$TMP"' EXIT

cd "$TMP" || exit 1
git init -q .
git config user.email teste@exemplo; git config user.name Teste
git config core.autocrlf false
mkdir -p app/api/anamneses prisma docs components scripts
cp "$VERIFICADOR" scripts/verificar-documentacao.sh
chmod +x scripts/verificar-documentacao.sh

echo "rota" > app/api/anamneses/route.js
echo "schema" > prisma/schema.prisma
echo "form" > components/anamnesis-form.jsx
printf 'api\n' > docs/api.md
printf 'modelo\n' > docs/modelo-de-dados.md
printf 'readme\n' > README.md
printf 'claude\n' > CLAUDE.md
git add -A && git commit -q -m base

falhas=0
verificar() {
  esperado=$1; rotulo=$2
  if ./scripts/verificar-documentacao.sh --staged > "$TMP/saida.txt" 2>&1; then obtido=passa; else obtido=falha; fi
  if [ "$obtido" = "$esperado" ]; then
    printf '  ok      %-52s (%s)\n' "$rotulo" "$obtido"
  else
    printf '  ERRO    %-52s esperado=%s obtido=%s\n' "$rotulo" "$esperado" "$obtido"
    sed 's/^/          | /' "$TMP/saida.txt"
    falhas=$((falhas + 1))
  fi
  git reset -q; git checkout -q -- . 2>/dev/null; git clean -qfd 2>/dev/null
}

substancial() { printf '\n## Seção\n\nPrimeira linha de descrição real do comportamento.\nSegunda linha.\n' >> "$1"; }

echo "Sistema: $(uname -s 2>/dev/null || echo desconhecido) | bash ${BASH_VERSION%%(*}"
echo

echo "alterado" >> app/api/anamneses/route.js; git add -A
verificar falha "rota alterada, nenhuma documentação"

echo "alterado" >> app/api/anamneses/route.js; substancial CLAUDE.md; git add -A
verificar falha "rota alterada, documento errado (CLAUDE.md)"

echo "alterado" >> app/api/anamneses/route.js; printf 'x\n' >> docs/api.md; git add -A
verificar falha "rota alterada, docs/api.md raso (1 linha)"

echo "alterado" >> app/api/anamneses/route.js; substancial docs/api.md; git add -A
verificar passa "rota alterada, docs/api.md com substância"

echo "alterado" >> prisma/schema.prisma; git add -A
verificar falha "schema alterado, sem modelo-de-dados"

echo "alterado" >> prisma/schema.prisma; substancial docs/modelo-de-dados.md; git add -A
verificar passa "schema alterado, modelo-de-dados atualizado"

echo "alterado" >> components/anamnesis-form.jsx; substancial docs/modelo-de-dados.md; git add -A
verificar passa "formulário alterado, modelo-de-dados atualizado"

git rm -q app/api/anamneses/route.js
verificar falha "rota REMOVIDA, nenhuma documentação"

printf 'FROM node\n' > Dockerfile; git add -A; git commit -q -m "acrescenta Dockerfile"
echo "RUN echo alterado" >> Dockerfile; git add -A
verificar falha "Dockerfile alterado, sem README"

echo "RUN echo alterado" >> Dockerfile; substancial README.md; git add -A
verificar passa "Dockerfile alterado, README atualizado"

substancial docs/api.md; git add -A
verificar passa "apenas documentação"

echo
if [ "$falhas" -gt 0 ]; then
  echo "$falhas cenário(s) com resultado inesperado."
  exit 1
fi
echo "Todos os cenários se comportaram como esperado."
