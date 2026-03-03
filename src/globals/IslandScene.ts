import type { GlobalConfig } from 'payload'

export const IslandScene: GlobalConfig = {
  slug: 'islandScene',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'background',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'maxZoomMult',
      type: 'number',
      defaultValue: 2.5,
      min: 1.2,
      max: 6,
    },
    {
      name: 'decorations',
      label: 'Decorations (Static)',
      type: 'array',
      minRows: 0,
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'name', type: 'text', required: true },
        { name: 'order', type: 'number', defaultValue: 0 },

        { name: 'image', type: 'upload', relationTo: 'media', required: true },

        // position as percent (same as hotspots)
        { name: 'x', type: 'number', required: true, min: 0, max: 100 },
        { name: 'y', type: 'number', required: true, min: 0, max: 100 },

        // world size (px on original map)
        {
          name: 'w',
          label: 'Width (px)',
          type: 'number',
          required: true,
          defaultValue: 120,
          min: 1,
        },
        {
          name: 'h',
          label: 'Height (px)',
          type: 'number',
          required: true,
          defaultValue: 120,
          min: 1,
        },

        // anchor like buildings
        { name: 'anchorX', type: 'number', defaultValue: 0.5, min: 0, max: 1 },
        { name: 'anchorY', type: 'number', defaultValue: 0.5, min: 0, max: 1 },

        // style
        { name: 'opacity', type: 'number', defaultValue: 1, min: 0, max: 1 },
        { name: 'rotate', label: 'Rotate (deg)', type: 'number', defaultValue: 0 },
        { name: 'flipX', type: 'checkbox', defaultValue: false },
      ],
    },

    {
      name: 'ambient',
      label: 'Ambient (Clouds / Birds)',
      type: 'array',
      minRows: 0,
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'name', type: 'text', required: true },
        { name: 'order', type: 'number', defaultValue: 0 },

        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'cloud',
          options: [
            { label: 'Cloud', value: 'cloud' },
            { label: 'Birds', value: 'birds' },
          ],
        },

        { name: 'image', type: 'upload', relationTo: 'media', required: true },

        // path (percent)
        { name: 'startX', type: 'number', required: true, min: -30, max: 130, defaultValue: -10 },
        { name: 'startY', type: 'number', required: true, min: -30, max: 130, defaultValue: 20 },
        { name: 'endX', type: 'number', required: true, min: -30, max: 130, defaultValue: 110 },
        { name: 'endY', type: 'number', required: true, min: -30, max: 130, defaultValue: 20 },

        // size (world px)
        {
          name: 'w',
          label: 'Width (px)',
          type: 'number',
          required: true,
          defaultValue: 240,
          min: 1,
        },
        {
          name: 'h',
          label: 'Height (px)',
          type: 'number',
          required: true,
          defaultValue: 140,
          min: 1,
        },

        { name: 'anchorX', type: 'number', defaultValue: 0.5, min: 0, max: 1 },
        { name: 'anchorY', type: 'number', defaultValue: 0.5, min: 0, max: 1 },

        // motion
        { name: 'durationMs', type: 'number', defaultValue: 22000, min: 1000 },
        { name: 'delayMs', type: 'number', defaultValue: 0, min: 0 },
        { name: 'loop', type: 'checkbox', defaultValue: true },

        // multi instances (useful for birds)
        { name: 'count', type: 'number', defaultValue: 1, min: 1, max: 25 },
        { name: 'spreadX', label: 'Spread X (px)', type: 'number', defaultValue: 0 },
        { name: 'spreadY', label: 'Spread Y (px)', type: 'number', defaultValue: 0 },
        { name: 'staggerMs', type: 'number', defaultValue: 600, min: 0 },

        // style
        { name: 'opacity', type: 'number', defaultValue: 1, min: 0, max: 1 },
        { name: 'rotate', label: 'Rotate (deg)', type: 'number', defaultValue: 0 },
        { name: 'flipX', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
