// Public business details shown on the Contact and policy pages.
// Set them in .env.local / your hosting environment (see .env.example).
// Anything left empty is simply not shown — nothing is made up.
export const SITE = Object.freeze({
  url: (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, ''),
  legalName: import.meta.env.VITE_BUSINESS_LEGAL_NAME ?? '',
  address: import.meta.env.VITE_BUSINESS_ADDRESS ?? '',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? '',
  supportPhone: import.meta.env.VITE_SUPPORT_PHONE ?? '',
  grievanceOfficer: import.meta.env.VITE_GRIEVANCE_OFFICER ?? '',
})

// Date the policy pages were last reviewed. Update when you change them.
export const POLICIES_UPDATED = '12 November 2026'
