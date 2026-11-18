import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
import { enableEmberHandover } from '@/components/ember-handover';

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
