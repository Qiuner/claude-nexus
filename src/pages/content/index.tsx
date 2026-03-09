/**
 * index.tsx
 * Purpose: Content script entry; only mounts the React root component.
 * Last updated: 2026-03-09
 */

import { createRoot } from 'react-dom/client';
import './style.css';
import FolderManager from './components/FolderManager';

const div = document.createElement('div');
div.id = '__root';
document.body.appendChild(div);

const rootContainer = document.querySelector('#__root');
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
root.render(
  <FolderManager />
);
