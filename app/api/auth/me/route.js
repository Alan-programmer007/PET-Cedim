import { NextResponse } from 'next/server'
import { lerSessao } from '@/lib/auth'

export async function GET(req) {
  const sessao = await lerSessao(req)
  if (!sessao) return NextResponse.json({ authenticated: false }, { status: 401 })
  return NextResponse.json({ authenticated: true, user: sessao })
}
