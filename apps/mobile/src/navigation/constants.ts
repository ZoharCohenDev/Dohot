export const ROUTES = {
  // Entry
  INDEX: '/',

  // Auth
  AUTH_LOGIN: '/(auth)/login',
  AUTH_EXPIRED: '/(auth)/expired',

  // Admin
  ADMIN_HOME: '/(admin)',
  ADMIN_CREATE_USER: '/(admin)/create-user',
  ADMIN_EDIT_USER: '/(admin)/edit-user',

  // Main app
  APP_HOME: '/(app)',
  APP_DOCUMENTS: '/(app)/documents',
  APP_CUSTOMERS: '/(app)/customers',
  APP_CREATE: '/(app)/create',
  APP_ME: '/(app)/me',

  // Wizard
  WIZARD_VOICE_IDLE: '/(app)/wizard/voice-idle',
  WIZARD_CUSTOMER: '/(app)/wizard/customer',
  WIZARD_ISSUE: '/(app)/wizard/issue',
  WIZARD_PHOTOS: '/(app)/wizard/photos',
  WIZARD_ANNOTATE: '/(app)/wizard/annotate',
  WIZARD_VOICE: '/(app)/wizard/voice',
  WIZARD_TRANSCRIPT: '/(app)/wizard/transcript',
  WIZARD_PROCESSING: '/(app)/wizard/processing',
  WIZARD_RECOMMENDATIONS: '/(app)/wizard/recommendations',
  WIZARD_QUOTE_ITEMS: '/(app)/wizard/quote-items',
  WIZARD_WARRANTY_TERMS: '/(app)/wizard/warranty-terms',
  WIZARD_PREVIEW: '/(app)/wizard/preview',
  WIZARD_SEND: '/(app)/wizard/send',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
