// Global polyfills for Node.js APIs (required for telegram/GramJS)
// Must be at the very top before any other imports
import { Buffer } from 'buffer';

// Create process mock inline (process/browser has path resolution issues on Vercel)
const processMock = {
  env: {},
  browser: true,
  version: '',
  platform: 'browser',
  nextTick: (fn: () => void) => setTimeout(fn, 0),
  cwd: () => '/',
  argv: [],
  pid: 1,
  title: 'browser',
};
// Create a complete os mock for telegram library
const osMock = {
  type: () => 'Browser',
  platform: () => 'browser',
  arch: () => 'wasm32',
  release: () => '1.0.0',
  hostname: () => 'browser',
  homedir: () => '/',
  tmpdir: () => '/tmp',
  cpus: () => [{ model: 'Browser', speed: 0 }],
  totalmem: () => 4 * 1024 * 1024 * 1024, // 4GB
  freemem: () => 2 * 1024 * 1024 * 1024, // 2GB
  networkInterfaces: () => ({}),
  EOL: '\n',
  endianness: () => 'LE',
};

// Set globals before any module loads
(window as any).Buffer = Buffer;
(window as any).global = window;
(window as any).process = processMock;
(globalThis as any).Buffer = Buffer;
(globalThis as any).process = processMock;

// Make os available globally for telegram library
(window as any).os = osMock;
(globalThis as any).os = osMock;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
