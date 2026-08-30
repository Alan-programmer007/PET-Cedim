"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Login realizado com sucesso!")
        router.push('/')
      } else {
        toast.error(data.error || "Erro ao fazer login. Verifique suas credenciais.")
      }
    } catch (error) {
      toast.error("Ocorreu um erro no servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-8 text-center flex justify-center">
          <img 
            src="/cedim.png" 
            alt="Logo CEDIM" 
            className="h-32 w-auto drop-shadow-sm" 
          />
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold text-gray-700">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10 h-12 border-gray-300 focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-semibold text-gray-700">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 h-12 border-gray-300 focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
