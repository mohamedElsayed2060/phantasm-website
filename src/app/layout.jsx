import './globals.css'
import { Inter } from 'next/font/google'

import config from '@payload-config'
import { handleServerFunctions, RootLayout as PayloadRootLayout } from '@payloadcms/next/layouts'
import { importMap } from './(payload)/admin/importMap.js'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: { default: 'Phantasm', template: '%s | Phantasm' },
  description: 'Phantasm website',
}

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
