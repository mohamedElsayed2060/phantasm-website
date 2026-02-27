import '@payloadcms/next/css' // ✅ مهم جدًا: يبقى هنا (root) عشان الهيدرشن
import './globals.css'

import { Inter } from 'next/font/google'
import { handleServerFunctions, RootLayout as PayloadRootLayout } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './(payload)/admin/importMap'

const inter = Inter({ subsets: ['latin'] })

const serverFunction = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function RootLayout({ children }) {
  return (
    <PayloadRootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      <div className={inter.className}>{children}</div>
    </PayloadRootLayout>
  )
}
