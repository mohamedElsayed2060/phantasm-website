import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const slugify = (input: string) =>
  String(input || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'projectName',
    defaultColumns: ['projectName', 'order', 'category', 'updatedAt'],
  },
  access: {
    read: () => true, // ✅ public
  },
  fields: [
    // order
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'relationship',
      relationTo: 'project-categories',
      required: true,
      hasMany: false, // ✅ مشروع واحد تحت كاتيجوري واحدة
      index: true,
    },
    // projectName
    {
      name: 'projectName',
      type: 'text',
      required: true,
    },
    // subTitle
    {
      name: 'subTitle',
      type: 'text',
      required: true,
    },
    // client
    {
      name: 'client',
      type: 'text',
      required: true,
    },
    // project type
    {
      name: 'type',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: false,
        },
        {
          name: 'icon',
          type: 'group',
          required: false,
          fields: [
            {
              name: 'icon1',
              type: 'upload',
              relationTo: 'media',
              required: false,
            },
            {
              name: 'icon2',
              type: 'upload',
              relationTo: 'media',
              required: false,
            },
            {
              name: 'icon3',
              type: 'upload',
              relationTo: 'media',
              required: false,
            },
          ],
        },
      ],
    },
    // challenge
    {
      name: 'challenge',
      type: 'richText',
      required: false,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },
    // coverage
    {
      name: 'coverage',
      type: 'richText',
      required: false,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },
    // descriptions
    {
      name: 'descriptions',
      type: 'richText',
      required: false,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures],
      }),
    },
    // Achievement مثال: "$1M+ in Revenue"
    {
      name: 'achievement',
      type: 'text',
      required: false,
    },
    // panelIntro
    {
      name: 'panelIntro',
      label: 'Panel Intro',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Short intro sentence shown in the project panel / popup before opening the details page.',
      },
    },
    // singleImage for the panal
    {
      name: 'singleImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },

    // ctaLabel
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'CHECK IT OUT',
    },
    // ctaType
    {
      name: 'ctaType',
      type: 'select',
      options: [
        { label: 'Route (project-details)', value: 'route' },
        { label: 'External URL', value: 'external' },
      ],
      defaultValue: 'route',
    },
    // ctaUrl if out side
    {
      name: 'ctaUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.ctaType === 'external',
      },
    },

    // =========================
    // Slug auto-generated
    // =========================
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: false,
      admin: {
        readOnly: true,
        description: 'Auto-generated from project name.',
      },
      hooks: {
        beforeChange: [
          ({ data, originalDoc, operation }) => {
            const newName = data?.projectName
            const oldName = originalDoc?.projectName

            // create: always generate
            if (operation === 'create') {
              if (!newName) return data?.slug
              return slugify(newName)
            }

            // update: regenerate only if name changed
            if (operation === 'update') {
              if (newName && oldName && newName !== oldName) {
                return slugify(newName)
              }
            }

            // keep existing
            return originalDoc?.slug
          },
        ],
      },
    },

    // =========================
    // Optional fields (كلها اختياري)
    // =========================

    // technologies
    {
      name: 'technologies',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
        {
          name: 'name',
          type: 'text',
          required: false,
        },
        {
          name: 'semiLarge',
          type: 'checkbox',
          required: false,
          defaultValue: false,
        },
      ],
    },

    // carousel images
    {
      name: 'carousel',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'images',
          type: 'array',
          required: false,
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: false,
            },
          ],
        },
      ],
    },
    // googlePlayUrl
    {
      name: 'googlePlayUrl',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'img',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
        {
          name: 'url',
          type: 'text',
          required: false,
        },
      ],
    },
    // appStoreUrl
    {
      name: 'appStoreUrl',
      type: 'group',
      required: false,
      fields: [
        {
          name: 'img',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
        {
          name: 'url',
          type: 'text',
          required: false,
        },
      ],
    },
    // normal single url
    {
      name: 'url',
      type: 'text',
      required: false,
    },
    // urlGroup
    {
      name: 'urlGroup',
      type: 'array',
      required: false,
      fields: [
        { name: 'url', type: 'text', required: false },
        { name: 'name', type: 'text', required: false },
        { name: 'btnText', type: 'text', required: false },
      ],
    },

    // comingSoon
    {
      name: 'comingSoon',
      type: 'checkbox',
      required: false,
      defaultValue: false,
    },
  ],
}
