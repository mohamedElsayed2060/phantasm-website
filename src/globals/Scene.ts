import type { GlobalConfig } from 'payload'

export const Scene: GlobalConfig = {
  slug: 'scene',
  access: {
    read: () => true, // ✅ public read
  },
  fields: [
    {
      name: 'sceneKey',
      label: 'Scene Key',
      type: 'text',
      defaultValue: 'phantasm-v1',
      required: true,
    },
    {
      name: 'canvasWidthDesktop',
      label: 'Canvas Width (Desktop)',
      type: 'number',
      required: true,
      defaultValue: 2000,
      admin: { step: 50 },
    },
    {
      name: 'canvasWidthTablet',
      label: 'Canvas Width (Tablet)',
      type: 'number',
      required: true,
      defaultValue: 1600,
      admin: { step: 50 },
    },
    {
      name: 'canvasWidthMobile',
      label: 'Canvas Width (Mobile)',
      type: 'number',
      required: true,
      defaultValue: 1200,
      admin: { step: 50 },
    },

    {
      name: 'background',
      label: 'Background image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'enableInertia',
      label: 'Enable inertia',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'idleGlowEnabled',
      label: 'Idle glow enabled',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
