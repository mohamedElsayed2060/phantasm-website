import type { CollectionConfig } from 'payload'

export const SceneHotspots: CollectionConfig = {
  slug: 'scene-hotspots',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order', 'x', 'y', 'updatedAt'],
  },
  access: {
    read: () => true, // ✅ public
  },
  fields: [
    {
      name: 'trigger',
      label: 'Trigger',
      type: 'select',
      defaultValue: 'click',
      options: [
        { label: 'Click / Tap', value: 'click' },
        { label: 'Hover (desktop only)', value: 'hover' },
      ],
      admin: {
        description: 'Hover works on desktop only. Mobile will still use tap.',
      },
    },

    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },

    // ✅ position as percent
    { name: 'x', type: 'number', required: true, min: 0, max: 100 },
    { name: 'y', type: 'number', required: true, min: 0, max: 100 },

    // ✅ building anchor (نفس اللي شغال عندك)
    { name: 'anchorX', type: 'number', defaultValue: 0.5, min: 0, max: 1 },
    { name: 'anchorY', type: 'number', defaultValue: 0.9, min: 0, max: 1 },

    // ✅ optional bounding box (يساعد في placement)
    { name: 'buildingW', type: 'number', defaultValue: 240 },
    { name: 'buildingH', type: 'number', defaultValue: 240 },

    // ✅ hotspot + building gifs
    { name: 'hotspotIdle', type: 'upload', relationTo: 'media' }, // gif glow/idle
    { name: 'buildingSpawn', type: 'upload', relationTo: 'media' }, // gif خروج المبنى

    { name: 'buildingLoop', type: 'upload', relationTo: 'media' }, // gif ثابت
    {
      name: 'spawnDurationMs',
      label: 'Spawn Duration (ms)',
      type: 'number',
      defaultValue: 1700,
      min: 0,
      admin: {
        description: 'How long the building spawn animation lasts (milliseconds).',
      },
    },
    // ✅ link projects
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
    },
    // ✅ Building Intro Dialog (NEW)
    {
      name: 'introEnabled',
      label: 'Intro Dialog Enabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'introPages',
      label: 'Intro Pages',
      type: 'array',
      minRows: 0,
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
        },
        {
          name: 'paragraphs',
          label: 'Paragraphs',
          type: 'array',
          minRows: 1,
          fields: [
            {
              name: 'text',
              label: 'Paragraph',
              type: 'textarea',
              required: true,
            },
          ],
        },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
