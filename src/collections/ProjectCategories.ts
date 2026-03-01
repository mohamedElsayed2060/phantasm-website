import type { CollectionConfig } from 'payload'

const slugify = (input: string) =>
  String(input || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export const ProjectCategories: CollectionConfig = {
  slug: 'project-categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'updatedAt'],
  },
  access: {
    read: () => true, // ✅ public
  },
  fields: [
    // order (للترتيب في الليست والـ dropdown)
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },

    // title
    {
      name: 'title',
      type: 'text',
      required: true,
    },

    // slug (auto)
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: false,
      admin: {
        readOnly: true,
        description: 'Auto-generated from category title.',
      },
      hooks: {
        beforeValidate: [
          ({ data, value, originalDoc, operation }) => {
            if (value) return value

            const name = data?.title ?? originalDoc?.title
            if (!name) return value

            if (operation === 'create') return slugify(name)

            const oldName = originalDoc?.title
            const newName = data?.title
            if (newName && oldName && newName !== oldName) return slugify(newName)

            return value
          },
        ],
      },
    },

    // optional: short subtitle/description لو هتظهر فوق الليست
    {
      name: 'subtitle',
      type: 'text',
      required: false,
    },
  ],
}
