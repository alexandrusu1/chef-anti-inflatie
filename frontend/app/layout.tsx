import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chef Anti-Inflație | Gătește inteligent, economisește mult',
  description: 'Descoperă rețete delicioase bazate pe produsele la reducere din supermarketuri. Economisește bani și gătește sănătos!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
