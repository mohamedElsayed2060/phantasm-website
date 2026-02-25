import type { GlobalConfig } from 'payload'

export const AboutUs: GlobalConfig = {
  slug: 'about-us',
  label: 'About Us',

  access: {
    read: () => true, // public
  },

  fields: [
    // =========================
    // Back button (PNG clickable)
    // =========================
    {
      name: 'backHref',
      type: 'text',
      defaultValue: '/',
      required: true,
      admin: {
        description: 'Where the back button navigates (e.g. /).',
      },
    },
    {
      name: 'backButtonImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },

    // =========================
    // Mission Box (PHANTASM + text)
    // =========================
    {
      name: 'companyLabel',
      type: 'text',
      defaultValue: 'PHANTASM',
      required: true,
    },
    {
      name: 'missionText',
      type: 'textarea',
      required: true,
    },

    // =========================
    // Team
    // =========================
    {
      name: 'teamTitle',
      type: 'text',
      defaultValue: 'TEAM',
      required: true,
    },

    {
      name: 'defaultMemberKey',
      type: 'text',
      required: true,
      admin: {
        description: 'Must match one of members[].key (e.g. mustafa).',
      },
    },

    {
      name: 'members',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },

        // 2 required images (static + animated)
        {
          name: 'avatarStatic',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'avatarAnimated',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },

        // optional real photo (if missing => show avatarStatic below)
        {
          name: 'realPhoto',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },

        // right-side typewriter text
        {
          name: 'bioText',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}
