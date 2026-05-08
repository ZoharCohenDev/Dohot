import type { Href } from 'expo-router';

type BackRouter = {
  back: () => void;
  replace: (href: Href) => void;
  canGoBack?: () => boolean;
};

export function safeBack(router: BackRouter, fallback: Href) {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
