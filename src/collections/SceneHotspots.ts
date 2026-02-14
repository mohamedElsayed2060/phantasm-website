import type { CollectionConfig } from 'payload'

export const SceneHotspots: CollectionConfig = {
  slug: 'scene-hotspots',
  access: {
    read: () => true, // ✅ public read
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'x', 'y', 'order'],
  },
  fields: [
    // --- ordering / basics
    {
      name: 'order',
      label: 'Order',
      type: 'number',
      defaultValue: 0,
      required: true,
      admin: { step: 1 },
    },
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      required: true,
    },
    {
      name: 'x',
      label: 'X (%)',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },
    {
      name: 'y',
      label: 'Y (%)',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
    },

    // --- hotspot icon (idle)
    {
      name: 'icon',
      label: 'Hotspot Icon (Animated WebP / GIF)',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'hotspotIdleW',
      label: 'Hotspot Icon width (px)',
      type: 'number',
      defaultValue: 96,
      required: false,
      admin: { step: 1 },
    },
    {
      name: 'hotspotIdleH',
      label: 'Hotspot Icon height (px)',
      type: 'number',
      defaultValue: 96,
      required: false,
      admin: { step: 1 },
    },

    // --- building assets
    {
      name: 'buildingPlaceholder',
      label: 'Building loop (Animated WebP / GIF)',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'buildingSpawn',
      label: 'Building spawn (Animated WebP / GIF) - optional',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'spawnDurationMs',
      label: 'Spawn duration (ms)',
      type: 'number',
      defaultValue: 1400,
      required: false,
      admin: { step: 50 },
    },
    {
      name: 'buildingW',
      label: 'Building width (px)',
      type: 'number',
      defaultValue: 220,
      required: false,
      admin: { step: 1 },
    },
    {
      name: 'buildingH',
      label: 'Building height (px)',
      type: 'number',
      defaultValue: 220,
      required: false,
      admin: { step: 1 },
    },

    // --- anchor (foot position relative to building box)
    {
      name: 'anchorX',
      label: 'Anchor X (%)',
      type: 'number',
      defaultValue: 50,
      min: 0,
      max: 100,
      required: false,
    },
    {
      name: 'anchorY',
      label: 'Anchor Y (%)',
      type: 'number',
      defaultValue: 92,
      min: 0,
      max: 100,
      required: false,
    },

    // --- intro dialog content (multi paragraph)
    {
      name: 'intro',
      label: 'Intro Dialog',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          label: 'Enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: false,
        },
        {
          name: 'preferredPlacement',
          label: 'Preferred placement',
          type: 'select',
          defaultValue: 'auto',
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Top', value: 'top' },
          ],
          required: false,
        },
        {
          name: 'paragraphs',
          label: 'Paragraphs',
          type: 'array',
          minRows: 0,
          fields: [
            {
              name: 'text',
              label: 'Text',
              type: 'textarea',
              required: true,
            },
          ],
        },
      ],
    },

    // --- projects list for this hotspot
    {
      name: 'projects',
      label: 'Projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      required: false,
    },
  ],
}
