// src/app/(payload)/layout.tsx
import '@payloadcms/next/css'
import './custom.scss'
import React from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
