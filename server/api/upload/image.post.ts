import { v2 as cloudinary } from 'cloudinary'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const config = useRuntimeConfig()

  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  })

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const file = formData.find(f => f.name === 'image')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'Image file is required' })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!file.type || !allowedTypes.includes(file.type)) {
    throw createError({ statusCode: 400, message: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' })
  }

  const maxSize = 10 * 1024 * 1024
  if (file.data.length > maxSize) {
    throw createError({ statusCode: 400, message: 'File too large. Maximum size: 10MB' })
  }

  const query = getQuery(event)
  const folderName = (query.folder as string) === 'products' ? 'vegy/products' : 'vegy/stores'

  try {
    const base64 = `data:${file.type};base64,${file.data.toString('base64')}`

    const result = await cloudinary.uploader.upload(base64, {
      folder: folderName,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw createError({ statusCode: 500, message: 'Failed to upload image' })
  }
})
