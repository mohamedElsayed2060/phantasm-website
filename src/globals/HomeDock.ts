import type { GlobalConfig } from 'payload'

export const HomeDock: GlobalConfig = {
  slug: 'home-dock',
  label: 'Home Dock',

  // ✅ مهم عشان يشتغل على الفرونت
  access: {
    read: () => true,
  },

  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'showOnlyOnHome', type: 'checkbox', defaultValue: true },

    {
      name: 'launcher',
      type: 'group',
      fields: [
        {
          name: 'position',
          type: 'select',
          defaultValue: 'bottom-left',
          options: [
            { label: 'Bottom Left', value: 'bottom-left' },
            { label: 'Bottom Right', value: 'bottom-right' },
          ],
        },
        { name: 'offsetX', type: 'number', defaultValue: 20 },
        { name: 'offsetY', type: 'number', defaultValue: 20 },
      ],
    },

    {
      name: 'assets',
      type: 'group',
      fields: [
        { name: 'openGif', type: 'upload', relationTo: 'media' },
        { name: 'staticPhone', type: 'upload', relationTo: 'media' },
      ],
    },

    {
      name: 'timing',
      type: 'group',
      fields: [{ name: 'spawnMs', type: 'number', defaultValue: 1200 }],
    },

    {
      name: 'ui',
      type: 'group',
      fields: [
        { name: 'animateIconsOnOpen', type: 'checkbox', defaultValue: true },
        { name: 'iconsStaggerMs', type: 'number', defaultValue: 60 },
      ],
    },

    // ✅ Screens (internal)
    {
      name: 'screens',
      type: 'array',
      fields: [
        { name: 'key', type: 'text', required: true }, // message / locations / phones
        { name: 'title', type: 'text', required: true },
        { name: 'icon', type: 'upload', relationTo: 'media' },

        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Message Form', value: 'messageForm' },
            { label: 'Locations List', value: 'locationsList' },
            { label: 'Phones List', value: 'phonesList' },
          ],
        },

        // message screen settings
        {
          name: 'message',
          type: 'group',
          admin: { condition: (_, s) => s?.type === 'messageForm' },
          fields: [
            { name: 'submitLabel', type: 'text', defaultValue: 'SEND' },
            { name: 'successText', type: 'text', defaultValue: 'Message sent!' },
            { name: 'recipientEmail', type: 'email' }, // optional
          ],
        },

        // locations screen data
        {
          name: 'locations',
          type: 'array',
          admin: { condition: (_, s) => s?.type === 'locationsList' },
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'address', type: 'textarea', required: true }, // multiline
            { name: 'highlight', type: 'checkbox', defaultValue: false },
          ],
        },

        // phones screen data
        {
          name: 'phones',
          type: 'array',
          admin: { condition: (_, s) => s?.type === 'phonesList' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'phone', type: 'text', required: true },
          ],
        },
      ],
    },

    // ✅ Icons grid items
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'order', type: 'number', defaultValue: 0 },
        { name: 'label', type: 'text', required: true },
        { name: 'icon', type: 'upload', relationTo: 'media' },

        // ✅ Top / Bottom box
        {
          name: 'slot',
          type: 'select',
          required: true,
          defaultValue: 'top',
          options: [
            { label: 'Top Box', value: 'top' },
            { label: 'Bottom Box', value: 'bottom' },
          ],
        },

        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Internal Screen', value: 'internal' },
            { label: 'Route', value: 'route' },
            { label: 'External Link', value: 'external' },
          ],
        },

        // internal
        {
          name: 'screenKey',
          type: 'text',
          admin: { condition: (_, siblingData) => siblingData?.type === 'internal' },
        },

        // route
        {
          name: 'routePath',
          type: 'text',
          admin: { condition: (_, siblingData) => siblingData?.type === 'route' },
        },

        // external
        {
          name: 'externalUrl',
          type: 'text',
          admin: { condition: (_, siblingData) => siblingData?.type === 'external' },
        },
      ],
    },
  ],
}
