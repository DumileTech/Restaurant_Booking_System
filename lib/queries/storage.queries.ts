import { supabase } from '@/lib/supabase'

// Upload file to storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string
    contentType?: string
    upsert?: boolean
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType || file.type,
      upsert: options?.upsert || false
    })

  if (error) throw error
  return data
}

// Download file from storage
export async function downloadFile(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)

  if (error) throw error
  return data
}

// Get public URL for file
export async function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

// Get signed URL for private file
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data
}

// List files in bucket
export async function listFiles(
  bucket: string,
  path?: string,
  options?: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order: 'asc' | 'desc' }
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: options?.limit || 100,
      offset: options?.offset || 0,
      sortBy: options?.sortBy || { column: 'name', order: 'asc' }
    })

  if (error) throw error
  return data
}

// Delete file from storage
export async function deleteFile(bucket: string, paths: string[]) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) throw error
  return data
}

// Move file in storage
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .move(fromPath, toPath)

  if (error) throw error
  return data
}

// Copy file in storage
export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .copy(fromPath, toPath)

  if (error) throw error
  return data
}

// Upload restaurant image
export async function uploadRestaurantImage(
  restaurantId: string,
  file: File
) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${restaurantId}-${Date.now()}.${fileExt}`
  const filePath = `restaurants/${fileName}`

  const { data, error } = await uploadFile('restaurant-images', filePath, file, {
    upsert: true
  })

  if (error) throw error

  const publicUrl = getPublicUrl('restaurant-images', filePath)
  return { ...data, publicUrl }
}

// Upload user avatar
export async function uploadUserAvatar(
  userId: string,
  file: File
) {
  const fileExt = file.name.split('.').pop()
  const fileName = `avatar.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { data, error } = await uploadFile('user-avatars', filePath, file, {
    upsert: true
  })

  if (error) throw error

  const signedUrl = await getSignedUrl('user-avatars', filePath, 3600 * 24 * 7) // 1 week
  return { ...data, signedUrl: signedUrl.signedUrl }
}

// Upload restaurant document
export async function uploadRestaurantDocument(
  restaurantId: string,
  file: File,
  documentType: string
) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${documentType}-${Date.now()}.${fileExt}`
  const filePath = `restaurants/${restaurantId}/${fileName}`

  const { data, error } = await uploadFile('documents', filePath, file)

  if (error) throw error

  const signedUrl = await getSignedUrl('documents', filePath)
  return { ...data, signedUrl: signedUrl.signedUrl }
}

// Get restaurant images
export async function getRestaurantImages(restaurantId: string) {
  const files = await listFiles('restaurant-images', 'restaurants')
  
  const restaurantFiles = files.filter(file => 
    file.name.startsWith(restaurantId)
  )

  return restaurantFiles.map(file => ({
    ...file,
    publicUrl: getPublicUrl('restaurant-images', `restaurants/${file.name}`)
  }))
}