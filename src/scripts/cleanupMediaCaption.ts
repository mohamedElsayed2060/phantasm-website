import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import payload from 'payload'

const isLexicalObject = (val: any) =>
  val && typeof val === 'object' && !Array.isArray(val) && 'root' in val

async function run() {
  const cfgMod = await import('../../src/payload.config')
  const config = (cfgMod as any).default

  // ✅ inject secret to avoid "missing secret key"
  config.secret = process.env.PAYLOAD_SECRET

  await payload.init({ config })

  const res = await payload.find({
    collection: 'media',
    limit: 5000,
  })

  let updated = 0

  for (const doc of res.docs as any[]) {
    // غالبًا caption في root doc: doc.caption
    // أو داخل sizes/metadata حسب تكوينك
    const val = doc.caption

    if (isLexicalObject(val)) {
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: { caption: '' }, // ✅ امسحها
      })
      updated++
    }
  }

  console.log(`Done. Updated ${updated} media item(s).`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
