import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from '@pages/options/Options';
import '@pages/options/index.css';
import { APP_ROOT_SELECTOR } from '@src/constants/selectors';

function init() {
  const rootContainer = document.querySelector(APP_ROOT_SELECTOR);
  if (!rootContainer) throw new Error("Can't find Options root element");
  const root = createRoot(rootContainer);
  root.render(<Options />);
}

init();
