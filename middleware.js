import { NextResponse } from 'next/server'
import { lerSessao } from '@/lib/auth'

// O middleware valida a assinatura do token, não apenas a presença do cookie.
// Ainda assim, cada rota de API refaz a verificação por conta própria: o middleware
// não é uma fronteira de segurança suficiente sozinho.
export async function middleware(req) {
  const ehPaginaDeLogin = req.nextUrl.pathname === '/login'
  const ehApi = req.nextUrl.pathname.startsWith('/api/')
  const sessao = await lerSessao(req)

  if (!sessao) {
    // Para chamadas de API, responder 401 em JSON: um redirecionamento faria o fetch
    // do navegador receber HTML e quebrar na leitura da resposta.
    if (ehApi) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (!ehPaginaDeLogin) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  if (ehPaginaDeLogin) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api/auth/login|cedim.png|CEDIM_LOGO.jpg|favicon.ico).*)']
}
