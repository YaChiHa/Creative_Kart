// Registers the service worker (public/sw.js) in production builds only.
// A failure here must never break the app, so every step is wrapped defensively.

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  // A new worker takes over immediately (see sw.js). When that happens on a page that
  // was already controlled by an older worker, reload once so the page and its cached
  // files come from the same version. The first-ever install does not reload.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) {
      return;
    }
    reloading = true;
    window.location.reload();
  });

  const register = (): void => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        // Look for a newer version whenever the app comes back to the foreground.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => undefined);
          }
        });
      })
      .catch((error: unknown) => {
        console.warn("Aurelle: service worker registration failed. The app still works online.", error);
      });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
