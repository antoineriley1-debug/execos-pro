import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EXECOS Pro',
  description: 'Production-grade business operations platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white">{children}</body>
    </html>
  )
}
