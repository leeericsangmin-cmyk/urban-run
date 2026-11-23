import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import App from './App.tsx';
import './index.css';
import {
  isKillSwitchLocked,
  setOnVerifiedActiveCallback,
} from './services/killSwitchService';

let swRegistered = false;

function ensureServiceWorkerRegistered(): void {
  if (swRegistered || typeof window === 'undefined') return;
  swRegistered = true;
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        void registration.update().catch(() => {});
      }
    },
  });
}

// Register immediately when not locked, and also allow re-registration if a live
// online check clears a stale local lock on a published deployment.
setOnVerifiedActiveCallback(ensureServiceWorkerRegistered);
if (!isKillSwitchLocked()) {
  ensureServiceWorkerRegistered();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
