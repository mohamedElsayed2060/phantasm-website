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
  ],
}
