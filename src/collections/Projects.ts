import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order', 'updatedAt'],
  },
  access: {
    read: () => true, // ✅ public
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'يُستخدم في /project-details/[slug]' },
    },

    // ✅ للّستة (ProjectsPopover)
    {
      name: 'shortDescription',
      type: 'textarea',
      localized: true,
    },

    // ✅ للتفاصيل الصغيرة (ProjectDetailsPanel)
    {
      name: 'detailsText',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'previewImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      defaultValue: 'CHECK IT OUT',
    },
    {
      name: 'ctaType',
      type: 'select',
      options: [
        { label: 'Route (project-details)', value: 'route' },
        { label: 'External URL', value: 'external' },
      ],
      defaultValue: 'route',
    },
    {
      name: 'ctaUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.ctaType === 'external',
      },
    },

    // ✅ ترتيب المشروع داخل مبنى واحد
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
