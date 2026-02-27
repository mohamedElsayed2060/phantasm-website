import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import payload from 'payload'

const looksLikeSlate = (val: any) => {
  // Slate غالبًا Array of nodes
  return Array.isArray(val) && val.length && typeof val[0] === 'object'
}

const scanObject = (obj: any, prefix = ''): string[] => {
  if (!obj || typeof obj !== 'object') return []
  const hits: string[] = []

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    const path = prefix ? `${prefix}.${key}` : key

    if (looksLikeSlate(val)) hits.push(path)
    else if (val && typeof val === 'object') hits.push(...scanObject(val, path))
  }

  return hits
}

async function run() {
  const cfgMod = await import('../../src/payload.config')
  const config = (cfgMod as any).default

  // ✅ inject secret (حل config.secret false)
  config.secret = process.env.PAYLOAD_SECRET

  await payload.init({ config })

  const res = await payload.find({
    collection: 'projects',
    limit: 2000,
  })

  let found = 0

  for (const doc of res.docs as any[]) {
    const hits = scanObject(doc)
    if (hits.length) {
      found++
      console.log('---')
      console.log('Project:', doc.id, doc.projectName || doc.title)
      console.log('Slate-like fields:', hits)
    }
  }

  console.log(`Scan done. Docs with Slate-like data: ${found}/${res.docs.length}`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
