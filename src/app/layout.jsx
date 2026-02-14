// src/app/layout.jsx
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: { default: 'Phantasm', template: '%s | Phantasm' },
  description: 'Phantasm website',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
