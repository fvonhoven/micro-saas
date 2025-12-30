import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@repo/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FormVault - Secure Document Collection',
  description: 'Collect documents from clients without requiring them to create accounts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

