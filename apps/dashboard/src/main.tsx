import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { enableEmberHandover } from '@irene/ember-bridge/handover';
import { App } from '@/App';

import '@/index.css';

enableEmberHandover();

const container = document.getElementById('root');

if (!container) {
  throw new Error('No #root element — check index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
