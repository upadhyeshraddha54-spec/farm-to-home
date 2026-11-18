import { t } from '../i18n'
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  isCloudinaryConfigured,
} from '../config/cloudinary'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '../utils/constants'

/** Returns an error message for an unacceptable file, or '' if it's fine. */
export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return t('“{name}” is not a JPG, PNG or WebP image.', { name: file.name })
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return t('“{name}” is larger than {size} MB.', { name: file.name, size: MAX_IMAGE_SIZE_MB })
  }
  return ''
}

/**
 * Uploads one image to Cloudinary using the unsigned upload preset.
 * Calls onProgress(0–100) while uploading.
 * Resolves to { url, publicId }.
 */
export function uploadImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      reject(new Error(t('Image uploads are not configured.')))
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    // XMLHttpRequest (instead of fetch) so we can report upload progress.
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      let body = null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        // fall through to the generic error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.secure_url) {
        resolve({ url: body.secure_url, publicId: body.public_id })
      } else {
        reject(new Error(t('Image upload failed. Please try again.')))
      }
    }

    xhr.onerror = () => reject(new Error(t('Network error while uploading. Please try again.')))
    xhr.send(formData)
  })
}

/**
 * Returns a resized, auto-compressed version of a Cloudinary image URL.
 * Cloudinary generates it on the fly — smaller files, faster pages.
 */
export function getOptimizedImageUrl(url, { width = 400, height = 400 } = {}) {
  if (!url || !url.includes('/image/upload/')) return url
  return url.replace(
    '/image/upload/',
    `/image/upload/f_auto,q_auto,c_fill,w_${width},h_${height}/`,
  )
}
