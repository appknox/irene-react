import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { syncEmberSession } from '@irene/api/utils/session';

import { App } from '@/App';
import { handOverToEmber } from '@/components/ember-paths';

import '@/index.css';

/* The Ember app reads its own session entry, which a sign-in before both apps shared an origin never wrote. */
syncEmberSession();

/*
  Before this app renders anything. A screen the Ember app still serves is
  loaded from there instead, rather than rendering here and reloading after.
*/
if (!handOverToEmber(window.location.pathname)) {
  renderDashboard();
}

/** Mounts the app, once this document is the one that answers for the URL. */
function renderDashboard() {
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('No #root element — check index.html');
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
