// Conferência de ambiente, executada pelo docker-entrypoint.sh antes de subir a aplicação.
//
// Falhar aqui é intencional: o processo sai com código 1, o `set -e` do entrypoint derruba o
// contêiner, o health check do cedim-deploy.sh não recebe resposta na porta 3000 e a implantação
// reverte para a versão anterior. Um ambiente mal configurado não entra no ar.
//
// ⚠️ NÃO mova esta conferência para dentro de `lerSessao`, em lib/auth.js. A chamada de `segredo()`
// acontece dentro de um `try` cujo `catch` devolve `null`, então a exceção seria engolida: toda
// sessão viraria inválida, `/login` continuaria respondendo 200 — é a única rota que o middleware
// libera sem sessão — e o health check da implantação passaria. O site ficaria "no ar" com ninguém
// conseguindo entrar, sem reversão e sem alerta.

// Valores que nunca devem assinar sessão em produção. O primeiro esteve publicado no
// `.env.example` e permanece no histórico do Git, então continua nesta lista mesmo depois de
// trocado no arquivo — quem tiver um `.env` antigo precisa ser barrado.
const SEGREDOS_PROIBIDOS = [
  'segredo_jwt_padrao_para_testes',
  'TROQUE_ESTE_VALOR'
]

const MINIMO_CARACTERES = 32
const COMO_GERAR = 'openssl rand -base64 48'

const producao = process.env.NODE_ENV === 'production'

// Aspas literais em volta do valor (JWT_SECRET='"abc"') fariam o segredo publicado passar como se
// fosse outro. Para a comparação, removem-se aspas externas e espaços; a aplicação usa o valor cru.
const bruto = (process.env.JWT_SECRET || '').trim()
const segredo = bruto.replace(/^(["'])(.*)\1$/, '$2').trim()
const erros = []

if (!segredo) {
  // Vale nos dois ambientes: sem segredo, lib/auth.js lança em toda requisição.
  erros.push(`JWT_SECRET não está definido. Gere um com: ${COMO_GERAR}`)
} else if (producao) {
  if (SEGREDOS_PROIBIDOS.includes(segredo)) {
    erros.push(
      'JWT_SECRET é um valor de exemplo, presente no histórico público do repositório. ' +
        'Quem o conhece pode assinar um token válido e entrar sem senha nenhuma. ' +
        `Gere um próprio: ${COMO_GERAR}`
    )
  } else if (segredo.length < MINIMO_CARACTERES) {
    erros.push(
      `JWT_SECRET tem ${segredo.length} caracteres; use ao menos ${MINIMO_CARACTERES}. ` +
        `Gere um com: ${COMO_GERAR}`
    )
  }
}

if (erros.length > 0) {
  console.error('\n[ambiente] a aplicação não vai subir:\n')
  for (const erro of erros) console.error(`  - ${erro}`)
  console.error('\nCorrija o .env do servidor e suba novamente.\n')
  process.exit(1)
}

console.log('[ambiente] conferência do JWT_SECRET: ok')
