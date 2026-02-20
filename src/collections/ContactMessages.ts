import type { CollectionConfig } from 'payload'

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  admin: {
    useAsTitle: 'name',
    group: 'Forms',
    defaultColumns: ['name', 'email', 'phone', 'createdAt'],
  },

  access: {
    // ✅ أي حد يقدر يبعت
    create: () => true,

    // ✅ القراءة للمسجلين فقط (admin)
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },

  fields: [
    { name: 'source', type: 'text', defaultValue: 'home-dock' },

    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'message', type: 'textarea', required: true },

    // مفيد للتتبع (اختياري)
    { name: 'userAgent', type: 'text' },
    { name: 'pageUrl', type: 'text' },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation !== 'create') return

        try {
          // ✅ هات recipient من شاشة message في Global home-dock لو موجود
          let recipient = process.env.CONTACT_RECIPIENT_EMAIL || '' // fallback env

          try {
            const dock = await req.payload.findGlobal({
              slug: 'home-dock',
              depth: 2,
            })

            const messageScreen = (dock as any)?.screens?.find(
              (s: any) =>
                String(s?.key || '')
                  .trim()
                  .toLowerCase() === 'message',
            )

            const fromCMS = messageScreen?.message?.recipientEmail
            if (fromCMS) recipient = fromCMS
          } catch {
            // ignore global fetch errors
          }

          if (!recipient) return

          const subject = `New message from ${doc?.name || 'Unknown'}`
          const text = [
            `Name: ${doc?.name || ''}`,
            `Email: ${doc?.email || ''}`,
            `Phone: ${doc?.phone || ''}`,
            `Page: ${doc?.pageUrl || ''}`,
            '',
            `Message:`,
            `${doc?.message || ''}`,
          ].join('\n')

          // ✅ يعتمد على email setup بتاع Payload عندكم
          await req.payload.sendEmail({
            to: recipient,
            subject,
            text,
          })
        } catch (e) {
          // لو الإيميل فشل لأي سبب، الرسالة تفضل محفوظة في DB عادي
          console.error('ContactMessages email send failed:', e)
        }
      },
    ],
  },
}
