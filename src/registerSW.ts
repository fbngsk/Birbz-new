// Service Worker Registration mit Update-Handling
// In main.tsx oder App.tsx importieren

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[App] SW registered:', registration.scope);

        // Check for updates periodically (alle 5 Minuten)
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Neue Version verfügbar
              showUpdateNotification(newWorker);
            }
          });
        });

      } catch (error) {
        console.error('[App] SW registration failed:', error);
      }
    });

    // Handle controller change (nach Update)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

function showUpdateNotification(worker: ServiceWorker) {
  // Option 1: Automatisch updaten (einfacher)
  // worker.postMessage('skipWaiting');
  
  // Option 2: User fragen (bessere UX)
  const shouldUpdate = window.confirm(
    '🐦 Neue Birbz-Version verfügbar!\n\nJetzt aktualisieren?'
  );
  
  if (shouldUpdate) {
    worker.postMessage('skipWaiting');
  }
}

// Für sofortiges Update ohne Nachfrage:
export function forceUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}
