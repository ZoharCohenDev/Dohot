/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
/**
 * Expo config plugin — forces RTL natively before React Native initializes.
 *
 * Why this exists:
 * `I18nManager.forceRTL(true)` from JS only writes a flag to NSUserDefaults /
 * SharedPreferences. The native UIWindow / RCTRootView semantic content
 * attribute is set ONCE when the native runtime initializes, and `RCTI18nUtil`
 * is a `dispatch_once` singleton — neither is re-evaluated on JS bundle reload.
 * `Updates.reloadAsync()` only reloads JS, not the native process, so on a
 * fresh production install the app boots LTR and stays LTR.
 *
 * The only reliable fix is to call forceRTL natively, BEFORE the React Native
 * factory creates the bridge. This plugin injects that call into both the iOS
 * AppDelegate (Swift) and the Android MainApplication (Kotlin/Java).
 *
 * Run via EAS Build (which invokes `expo prebuild` and applies plugins).
 */
const { withAppDelegate, withMainApplication } = require('@expo/config-plugins');

console.log('[withForceRTL] plugin running — will inject native RTL into iOS AppDelegate and Android MainApplication');

const MARKER = 'dohot:forceRTL';

const SWIFT_BLOCK = `
    // ${MARKER}: Force RTL natively before React Native initializes.
    // Required for production — JS-side I18nManager.forceRTL only persists a
    // flag; the native UIWindow direction is fixed at first launch.
    RCTI18nUtil.sharedInstance().allowRTL(true)
    RCTI18nUtil.sharedInstance().forceRTL(true)
`;

const OBJC_BLOCK = `
  // ${MARKER}: Force RTL natively before React Native initializes.
  [[RCTI18nUtil sharedInstance] allowRTL:YES];
  [[RCTI18nUtil sharedInstance] forceRTL:YES];
`;

const KOTLIN_BLOCK = `
    // ${MARKER}: Force RTL natively before React Native initializes.
    val i18nUtil = com.facebook.react.modules.i18nmanager.I18nUtil.getInstance()
    i18nUtil.allowRTL(this, true)
    i18nUtil.forceRTL(this, true)
`;

const JAVA_BLOCK = `
    // ${MARKER}: Force RTL natively before React Native initializes.
    com.facebook.react.modules.i18nmanager.I18nUtil i18nUtil =
        com.facebook.react.modules.i18nmanager.I18nUtil.getInstance();
    i18nUtil.allowRTL(getApplicationContext(), true);
    i18nUtil.forceRTL(getApplicationContext(), true);
`;

function injectIOS(contents, language) {
  if (contents.includes(MARKER)) {
    console.log('[withForceRTL] iOS: already injected (idempotent skip)');
    return contents;
  }

  if (language === 'swift') {
    // Insert at the very start of `application(_:didFinishLaunchingWithOptions:)`
    const re = /(override\s+(?:public\s+)?func\s+application\([^)]*\)\s*->\s*Bool\s*\{)/;
    if (!re.test(contents)) {
      console.warn('[withForceRTL] iOS (swift): didFinishLaunchingWithOptions not found — RTL not injected');
      return contents;
    }
    console.log('[withForceRTL] iOS (swift): injection SUCCESS');
    return contents.replace(re, `$1${SWIFT_BLOCK}`);
  }

  // Objective-C / Objective-C++
  const re = /(- \(BOOL\)application:[^{]*didFinishLaunchingWithOptions:[^{]*\{)/;
  if (!re.test(contents)) {
    console.warn('[withForceRTL] iOS (objc): didFinishLaunchingWithOptions not found — RTL not injected');
    return contents;
  }
  console.log('[withForceRTL] iOS (objc): injection SUCCESS');
  return contents.replace(re, `$1${OBJC_BLOCK}`);
}

function injectAndroid(contents, language) {
  if (contents.includes(MARKER)) {
    console.log('[withForceRTL] Android: already injected (idempotent skip)');
    return contents;
  }

  if (language === 'kt') {
    // Inject AFTER super.onCreate() — `this` (Application) is safe to use only
    // after super has initialized. I18nUtil writes to SharedPreferences
    // synchronously; RN bridge reads it later when it initializes.
    const re = /(super\.onCreate\(\))/;
    if (!re.test(contents)) {
      console.warn('[withForceRTL] Android (kt): super.onCreate() not found — RTL not injected');
      return contents;
    }
    console.log('[withForceRTL] Android (kt): injection SUCCESS (after super.onCreate)');
    return contents.replace(re, `$1\n${KOTLIN_BLOCK}`);
  }

  // Java — inject AFTER super.onCreate() for same reason
  const re = /(super\.onCreate\(\);)/;
  if (!re.test(contents)) {
    console.warn('[withForceRTL] Android (java): super.onCreate() not found — RTL not injected');
    return contents;
  }
  console.log('[withForceRTL] Android (java): injection SUCCESS (after super.onCreate)');
  return contents.replace(re, `$1\n${JAVA_BLOCK}`);
}

const withForceRTL = (config) => {
  config = withAppDelegate(config, (cfg) => {
    cfg.modResults.contents = injectIOS(cfg.modResults.contents, cfg.modResults.language);
    return cfg;
  });

  config = withMainApplication(config, (cfg) => {
    cfg.modResults.contents = injectAndroid(cfg.modResults.contents, cfg.modResults.language);
    return cfg;
  });

  return config;
};

module.exports = withForceRTL;
