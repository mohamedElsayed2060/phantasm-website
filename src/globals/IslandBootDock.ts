import type { GlobalConfig } from 'payload'

const IslandBootDock: GlobalConfig = {
  slug: 'islandBootDock',
  label: 'Island Boot Dock',
  // admin: { group: 'Island' },
  access: {
    read: () => true, // ✅ allow public read
  },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Enable dock' },

    { name: 'title', type: 'text', localized: true, required: true },

    {
      name: 'pages',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [{ name: 'text', type: 'textarea', localized: true, required: true }],
    },
  ],
}

export default IslandBootDock
