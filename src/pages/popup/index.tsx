/**
 * Popup entry that initializes i18n and mounts the React root.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import '@pages/popup/index.css';
import '@assets/styles/tailwind.css';
import Popup from '@pages/popup/Popup';
import { initI18n } from '@src/services/i18n';

/**
 * Initializes i18n and mounts the popup React application.
 * @returns Promise<void>
 */
async function init() {
  await initI18n();
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Popup root element");
  const root = createRoot(rootContainer);
  root.render(<Popup />);
}

void init();
