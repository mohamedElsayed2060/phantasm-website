import type { GlobalConfig } from 'payload'

export const DialogSettings: GlobalConfig = {
  slug: 'dialog-settings',
  access: {
    read: () => true, // ✅ public read
  },
  fields: [
    {
      name: 'typingSpeedMs',
      label: 'Typing speed (ms per char)',
      type: 'number',
      defaultValue: 25,
      min: 5,
      max: 200,
      required: true,
    },
    {
      name: 'cursor',
      label: 'Cursor character',
      type: 'text',
      defaultValue: '█',
      required: true,
    },
    {
      name: 'hudPosition',
      label: 'HUD position',
      type: 'select',
      defaultValue: 'bottom',
      options: [
        { label: 'Bottom', value: 'bottom' },
        { label: 'Top', value: 'top' },
      ],
      required: true,
    },
    {
      name: 'enableSound',
      label: 'Enable typing sound',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'defaultSpeakerName',
      label: 'Default speaker name',
      type: 'text',
      defaultValue: 'Narrator',
    },
  ],
}
