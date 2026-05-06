export const ROUTES = {
  // Entry
  INDEX: '/',

  // Auth
  AUTH_LOGIN: '/(auth)/login',
  AUTH_REGISTER: '/(auth)/register',
  AUTH_WELCOME: '/(auth)/welcome',
  AUTH_PROFILE: '/(auth)/profile',
  AUTH_TRUST: '/(auth)/trust',

  // Onboarding
  ONBOARDING_BUSINESS: '/(onboarding)/business-setup',

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
  WIZARD_PROCESSING: '/(app)/wizard/processing',
  WIZARD_RECOMMENDATIONS: '/(app)/wizard/recommendations',
  WIZARD_PREVIEW: '/(app)/wizard/preview',
  WIZARD_SEND: '/(app)/wizard/send',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
