import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@repo/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CronGuard - Cron Job Monitoring',
  description: 'Monitor your cron jobs and get alerted when they fail',
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

