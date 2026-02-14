import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true, // ✅ public read (frontend needs it)
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tag', 'order', 'updatedAt'],
  },
  fields: [
    {
      name: 'order',
      label: 'Order',
      type: 'number',
      defaultValue: 0,
      required: true,
      admin: { step: 1 },
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'tag',
      label: 'Tag (optional)',
      type: 'text',
      required: false,
    },
    {
      name: 'shortDescription',
      label: 'Short description (panel)',
      type: 'textarea',
      required: false,
    },
    {
      name: 'thumb',
      label: 'Thumbnail (optional)',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },

    // ✅ optional: link to details page later
    {
      name: 'slug',
      label: 'Slug (optional)',
      type: 'text',
      required: false,
      admin: {
        description: 'Used later for /projects/[slug]. Leave empty for now if you want.',
      },
    },

    // ✅ optional: reverse link if you want (not required for now)
    {
      name: 'hotspot',
      label: 'Hotspot (optional)',
      type: 'relationship',
      relationTo: 'scene-hotspots',
      required: false,
    },
  ],
}
