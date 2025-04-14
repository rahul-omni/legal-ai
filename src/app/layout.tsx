import './globals.css'
import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { ToastContainer } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Legal Document Platform',
  description: 'AI-powered legal document platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <ToastContainer toasts={[]} />
      </body>
    </html>
  )
}
