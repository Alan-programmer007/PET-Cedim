import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(req) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('token='))
    const token = match ? match.split('=')[1] : null
    if (!token) return NextResponse.json({ authenticated: false }, { status: 200 })

    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not set')

    try {
      const payload = jwt.verify(token, secret)
      return NextResponse.json({ authenticated: true, user: payload })
    } catch (err) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
