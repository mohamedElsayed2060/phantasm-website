import type { CollectionBeforeChangeHook } from 'payload'

export const skipImageSizesForGif: CollectionBeforeChangeHook = async ({ data, req }) => {
  // when uploading files, multer puts file info on req.file
  const file = (req as any)?.file
  const mime = file?.mimetype || data?.mimeType || data?.mime

  if (mime === 'image/gif') {
    // Payload will still store original file, but we want to avoid generating image sizes
    // by telling Payload not to process sizes for this upload
    ;(req as any).payloadUploadSizes = [] // ✅ prevent sizes generation
  }

  return data
}
