// src/payload/globals/playerSelection.ts
import type { GlobalConfig } from 'payload'

export const PlayerSelection: GlobalConfig = {
  slug: 'player-selection',
  access: {
    read: () => true, // ✅ allow public read
  },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: true },
    { name: 'title', type: 'text', defaultValue: 'Pick Your Player' },
    {
      name: 'players',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'badgeLabel', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'avatarImage', type: 'upload', relationTo: 'media' },
        { name: 'order', type: 'number' },
      ],
    },
  ],
}
