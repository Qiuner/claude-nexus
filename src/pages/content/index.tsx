/**
 * index.tsx
 * Purpose: Content script entry; only mounts the React root component.
 * Last updated: 2026-03-09
 */

import { createRoot } from 'react-dom/client';
import { i18n, initI18n, LANGUAGE_CHANGE_MESSAGE_TYPE } from '@src/services/i18n';
import './style.css';
import FolderManager from './components/FolderManager';
import Timeline from './components/Timeline';
import FloatBall from './components/FloatBall';
import { initExportButtonInjection } from './components/ExportButton';
import { initPromptButtonInjection } from './components/PromptButton';

const mount = async () => {
  await initI18n();

  chrome.runtime.onMessage.addListener((message: unknown) => {
    if (!message || typeof message !== 'object') return;
    const payload = message as { type?: string; lang?: string };
    if (payload.type !== LANGUAGE_CHANGE_MESSAGE_TYPE) return;
    if (payload.lang !== 'en' && payload.lang !== 'zh' && payload.lang !== 'zh-TW') return;
    void i18n.changeLanguage(payload.lang);
  });

  const div = document.createElement('div');
  div.id = '__root';
  document.body.appendChild(div);

  const rootContainer = document.querySelector('#__root');
  if (!rootContainer) throw new Error("Can't find Content root element");
  const root = createRoot(rootContainer);
  root.render(
    <>
      <FolderManager />
      <Timeline />
      <FloatBall />
    </>,
  );

  initExportButtonInjection();
  initPromptButtonInjection();
};

void mount();
