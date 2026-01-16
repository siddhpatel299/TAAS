/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Telegram API credentials for direct browser-to-Telegram uploads
  // These are safe to expose - they identify the app, not authenticate users
  readonly VITE_TELEGRAM_API_ID: string;
  readonly VITE_TELEGRAM_API_HASH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
