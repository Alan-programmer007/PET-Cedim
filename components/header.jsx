"use client"

import * as React from 'react'
import { Menu, LogOut, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/components/ui/use-mobile"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function Header() {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const router = useRouter()
  
  React.useEffect(() => {
    if (!isMobile && open) {
      setOpen(false)
    }
  }, [isMobile, open])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success("Logout realizado com sucesso");
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 text-slate-800 px-6 py-4 fixed top-0 left-0 w-full z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <div className="flex items-center gap-2">
            <img 
              src="/cedim.png" 
              alt="Logo CEDIM - Centro de Diagnóstico e Imagem Professor Alberto Cardoso" 
              className="h-20 w-auto drop-shadow-sm" 
            />
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center">
            <nav className="flex items-center gap-10">
              <a href="/" className="text-sm font-semibold tracking-wide text-slate-600 hover:text-primary transition-colors">
                ANAMNESES
              </a>
              <a href="/registros" className="text-sm font-semibold tracking-wide text-slate-600 hover:text-primary transition-colors">
                REGISTROS
              </a>
              <a href="/metricas" className="text-sm font-semibold tracking-wide text-slate-600 hover:text-primary transition-colors">
                MÉTRICAS
              </a>
            </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
            <Button variant="outline" className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-slate-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-white text-slate-800 w-4/5 border-r-0 shadow-2xl">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de Navegação</SheetTitle>
              <SheetDescription>Links para as páginas principais do sistema.</SheetDescription>
            </SheetHeader>
            
            <div className="flex items-center justify-center py-10 border-b border-gray-100 mb-6">
                 <img 
                    src="/cedim.png" 
                    alt="Logo CEDIM" 
                    className="h-32 w-auto" 
                 />
            </div>

            <nav className="flex flex-col gap-6 items-center">
              <a href="/" className="text-lg font-semibold text-slate-700 hover:text-primary transition-colors w-full text-center py-2">
                Anamneses
              </a>
              <a href="/registros" className="text-lg font-semibold text-slate-700 hover:text-primary transition-colors w-full text-center py-2">
                Registros
              </a>
              <a href="/metricas" className="text-lg font-semibold text-slate-700 hover:text-primary transition-colors w-full text-center py-2">
                Métricas
              </a>
              <div className="w-full h-px bg-gray-100 my-4"></div>
              <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 justify-center" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-3" /> Sair
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}