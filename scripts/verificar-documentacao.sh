#!/bin/bash
# Confere se a documentação exigida acompanha o código alterado.
#
# Não basta mexer em "alguma" documentação: cada área do código exige o documento
# correspondente, e a alteração precisa ter substância — acrescentar uma linha em branco
# não satisfaz a regra.
#
# Uso:
#   scripts/verificar-documentacao.sh --staged          (antes do commit)
#   scripts/verificar-documentacao.sh <base> <head>     (no CI)
#
# Chamado pelo hook .githooks/pre-commit e pelo job "Documentação acompanha o código".
set -u

LINHAS_MINIMAS=2   # linhas acrescentadas, sem contar em branco

if [ "${1:-}" = "--staged" ]; then
  alterados=$(git diff --cached --name-only)
  diff_de() { git diff --cached -U0 -- "$1"; }
else
  base="${1:?informe a base}"; head="${2:?informe o head}"
  alterados=$(git diff --name-only "$base" "$head")
  diff_de() { git diff -U0 "$base" "$head" -- "$1"; }
fi

[ -z "$alterados" ] && { echo "Nenhum arquivo alterado."; exit 0; }

# Uma regra por linha, separada por ;; — o | não serve, aparece dentro dos padrões.
REGRAS=(
  '^app/api/;;docs/api.md;;o contrato das rotas, os códigos de resposta e os exemplos vivem aqui'
  '^(middleware\.js|lib/auth\.js)$;;docs/api.md;;a seção de autenticação descreve exatamente esse comportamento'
  '^prisma/(schema\.prisma|migrations/);;docs/modelo-de-dados.md;;a estrutura das tabelas está descrita aqui'
  '^components/(anamnesis-form|breast-marking-canvas)\.jsx$;;docs/modelo-de-dados.md;;os campos da anamnese nascem nesses arquivos'
  '^(next\.config\.mjs|Dockerfile|docker-compose.*\.yml|docker-entrypoint\.sh)$;;README.md;;instalação, execução e configuração são descritas aqui'
)

# Qualquer código que não caia numa regra específica ainda exige algum documento.
CODIGO_GERAL='^(app/|components/|lib/|hooks/|prisma/|middleware\.js|next\.config\.mjs|package\.json)'
DOC_QUALQUER='^(docs/|README\.md|CLAUDE\.md|AGENTS\.md|db/README\.md)'

# Conta linhas acrescentadas não vazias num arquivo.
substancia() {
  diff_de "$1" | grep '^+' | grep -v '^+++' | sed 's/^+//' | grep -cv '^[[:space:]]*$'
}

codigo=$(echo "$alterados" | grep -E "$CODIGO_GERAL" | grep -v '^components/ui/')
docs=$(echo "$alterados" | grep -E "$DOC_QUALQUER")

echo "── Código alterado ──"; [ -n "$codigo" ] && echo "$codigo" || echo "(nenhum)"
echo "── Documentação alterada ──"; [ -n "$docs" ] && echo "$docs" || echo "(nenhuma)"
echo

[ -z "$codigo" ] && { echo "Sem alteração de código: regra não se aplica."; exit 0; }

faltas=0

# 1) regras por área
for regra in "${REGRAS[@]}"; do
  padrao="${regra%%;;*}"; resto="${regra#*;;}"
  doc="${resto%%;;*}"; motivo="${resto#*;;}"

  gatilho=$(echo "$codigo" | grep -E "$padrao")
  [ -z "$gatilho" ] && continue

  if ! echo "$docs" | grep -qxF "$doc"; then
    echo "FALTA  $doc"
    echo "       porque você alterou:"; echo "$gatilho" | sed 's/^/         /'
    echo "       $motivo"
    echo
    faltas=$((faltas + 1))
    continue
  fi

  n=$(substancia "$doc")
  if [ "$n" -lt "$LINHAS_MINIMAS" ]; then
    echo "RASO   $doc — só $n linha(s) acrescentada(s); o mínimo é $LINHAS_MINIMAS"
    echo "       Descreva de fato o que mudou; tocar o arquivo não é documentar."
    echo
    faltas=$((faltas + 1))
  fi
done

# 2) rede de segurança: código sem regra específica ainda exige algum documento
if [ -z "$docs" ]; then
  echo "FALTA  qualquer documentação"
  echo "       Houve alteração de código e nenhum documento foi tocado."
  echo
  faltas=$((faltas + 1))
fi

if [ "$faltas" -gt 0 ]; then
  cat <<'FIM'
────────────────────────────────────────────────────────────────────────
A documentação não acompanhou o código. Esta regra não é negociável.

O que escrever em cada caso está em CLAUDE.md. Em resumo:

  rotas em app/api/, middleware.js, lib/auth.js  ->  docs/api.md
  prisma/schema.prisma, campos do formulário     ->  docs/modelo-de-dados.md
  package.json, Dockerfile, next.config.mjs      ->  README.md
  item resolvido de melhorias                    ->  docs/MELHORIAS.md (com a data)

Descreva o comportamento novo, não o commit. Quem lê a documentação não vê
o diff.

Não desative esta verificação nem remova o hook.
────────────────────────────────────────────────────────────────────────
FIM
  exit 1
fi

echo "Documentação acompanhou o código."
