// Verificação da sessão, compartilhada pelo middleware e pelas rotas de API.
//
// Usa `jose` em vez de `jsonwebtoken` porque o middleware do Next roda no Edge Runtime,
// onde o módulo `crypto` do Node não existe. O `jose` usa Web Crypto e funciona nos dois
// ambientes, então middleware e rotas compartilham exatamente a mesma verificação.

import { jwtVerify } from 'jose'

export const NOME_COOKIE = 'token'

function segredo() {
  const valor = process.env.JWT_SECRET
  if (!valor) throw new Error('JWT_SECRET não está definido')
  return new TextEncoder().encode(valor)
}

// Lê o token do NextRequest (middleware e rotas) ou, como alternativa, do cabeçalho Cookie.
function lerToken(req) {
  const doCookie = req?.cookies?.get?.(NOME_COOKIE)
  if (doCookie?.value) return doCookie.value

  const cabecalho = req?.headers?.get?.('cookie') || ''
  const par = cabecalho
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${NOME_COOKIE}=`))
  return par ? par.slice(NOME_COOKIE.length + 1) : null
}

/**
 * Devolve o conteúdo do token quando ele existe E a assinatura é válida.
 * Devolve null em qualquer outro caso: sem cookie, assinatura inválida ou token expirado.
 *
 * Presença de cookie não é autenticação — só o retorno não-nulo desta função é.
 */
export async function lerSessao(req) {
  const token = lerToken(req)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, segredo(), { algorithms: ['HS256'] })
    return payload
  } catch {
    return null
  }
}
