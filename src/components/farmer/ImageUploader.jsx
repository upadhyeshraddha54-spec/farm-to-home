import { useEffect, useId, useState } from 'react'
import { isCloudinaryConfigured } from '../../config/cloudinary'
import {
  getOptimizedImageUrl,
  uploadImage,
  validateImageFile,
} from '../../services/cloudinaryService'
import { MAX_IMAGE_SIZE_MB, MAX_PRODUCT_IMAGES } from '../../utils/constants'
import Alert from '../ui/Alert'
import { t, tx } from '../../i18n'

/**
 * Upload and manage up to MAX_PRODUCT_IMAGES product photos.
 * The first image is the cover shown in listings.
 *
 * Props:
 *  - images: [{ url, publicId }]
 *  - setImages(updater): updater receives the latest images array
 *  - onBusyChange(boolean): told when uploads start/finish (to block saving)
 *  - error: validation message from the parent form
 */
export default function ImageUploader({ images, setImages, onBusyChange, error }) {
  const inputId = useId()
  const [uploads, setUploads] = useState([]) // [{ id, name, progress }]
  const [uploadErrors, setUploadErrors] = useState([])

  const isBusy = uploads.length > 0
  useEffect(() => {
    onBusyChange?.(isBusy)
  }, [isBusy, onBusyChange])

  const slotsLeft = MAX_PRODUCT_IMAGES - images.length - uploads.length

  function handleFiles(event) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // allow choosing the same file again later
    if (!files.length) return

    const errors = []
    const accepted = []
    files.forEach((file) => {
      const message = validateImageFile(file)
      if (message) errors.push(message)
      else accepted.push(file)
    })
    if (accepted.length > slotsLeft) {
      errors.push(t('You can add {max} photos at most. Extra files were skipped.', { max: MAX_PRODUCT_IMAGES }))
      accepted.splice(Math.max(slotsLeft, 0))
    }
    setUploadErrors(errors)

    accepted.forEach((file) => {
      const id = crypto.randomUUID()
      setUploads((prev) => [...prev, { id, name: file.name, progress: 0 }])

      uploadImage(file, (progress) =>
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress } : u))),
      )
        .then((image) => setImages((prev) => [...prev, image]))
        .catch((err) =>
          setUploadErrors((prev) => [...prev, `"${file.name}": ${err.message}`]),
        )
        .finally(() => setUploads((prev) => prev.filter((u) => u.id !== id)))
    })
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function makeCover(index) {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)])
  }

  if (!isCloudinaryConfigured) {
    return (
      <Alert variant="warning" title={t('Image uploads are not set up')}>
        {tx('Add <a>VITE_CLOUDINARY_CLOUD_NAME</a> and <b>VITE_CLOUDINARY_UPLOAD_PRESET</b> to <c>.env.local</c>, then restart the dev server.', {
          a: (text) => <code>{text}</code>,
          b: (text) => <code>{text}</code>,
          c: (text) => <code>{text}</code>,
        })}
      </Alert>
    )
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-800">{t('Photos')}</p>
      <p className="mb-3 text-xs text-gray-500">
        {t('Up to {max} photos · JPG, PNG or WebP · max {size} MB each. The first photo is the cover.', { max: MAX_PRODUCT_IMAGES, size: MAX_IMAGE_SIZE_MB })}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((image, index) => (
          <li
            key={image.publicId ?? image.url}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <img
              src={getOptimizedImageUrl(image.url, { width: 300, height: 300 })}
              alt={t('Product photo {number}', { number: index + 1 })}
              className="aspect-square w-full object-cover"
            />
            {index === 0 && (
              <span className="absolute top-2 left-2 rounded bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                {t('Cover')}
              </span>
            )}
            <div className="flex divide-x divide-gray-200 border-t border-gray-200 text-xs font-medium">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(index)}
                  className="flex-1 py-2 text-brand-700 hover:bg-brand-50"
                >
                  {t('Make cover')}
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="flex-1 py-2 text-red-600 hover:bg-red-50"
              >
                {t('Remove')}
              </button>
            </div>
          </li>
        ))}

        {uploads.map((upload) => (
          <li
            key={upload.id}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-3"
          >
            <span className="w-full truncate text-center text-xs text-gray-600">
              {upload.name}
            </span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full bg-brand-600 transition-[width]"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-brand-700">{upload.progress}%</span>
          </li>
        ))}

        {slotsLeft > 0 && (
          <li>
            <label
              htmlFor={inputId}
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand-300 ${
                error
                  ? 'border-red-400 text-red-600'
                  : 'border-brand-300 text-brand-700 hover:bg-brand-50'
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                +
              </span>
              {t('Add photos')}
              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFiles}
                className="sr-only"
              />
            </label>
          </li>
        )}
      </ul>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {uploadErrors.length > 0 && (
        <Alert variant="error" className="mt-3">
          <ul className="list-disc space-y-1 pl-4">
            {uploadErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  )
}
