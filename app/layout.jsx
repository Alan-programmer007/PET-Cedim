import { Roboto } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
})

export const metadata = {
  title: "Sistema de Anamneses",
  description: "Sistema de registro de anamneses CEDIM.",
  icons: {
    icon: "/cedim.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
