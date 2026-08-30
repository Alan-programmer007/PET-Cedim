import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

const TOKEN_NAME = 'token'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(req) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not set')

    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' })

    const res = NextResponse.json({ ok: true })
    res.headers.set('Set-Cookie', serialize(TOKEN_NAME, token, {
      httpOnly: true,
      path: '/',
      maxAge: MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }))
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
