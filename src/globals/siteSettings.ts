// src/payload/globals/siteSettings.ts
import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true, // ✅ allow public read
  },
  fields: [
    { name: 'companyName', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },

    {
      name: 'splash',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'minDurationMs', type: 'number', defaultValue: 1200 },
        { name: 'backgroundBlur', type: 'text', defaultValue: '12px' },
        { name: 'showEveryVisit', type: 'checkbox', defaultValue: true },
      ],
    },
  ],
}
