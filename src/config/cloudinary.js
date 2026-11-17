// Cloudinary settings from `.env.local`.
// Both values are PUBLIC. Uploads use an *unsigned upload preset*, whose
// limits (folder, formats, max size) are configured in the Cloudinary
// dashboard. The API secret is never used in this app.
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET,
)
