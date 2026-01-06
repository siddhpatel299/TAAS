/// <reference types="electron-vite/node" />

declare namespace NodeJS {
  interface ProcessEnv {
    TELEGRAM_API_ID?: string;
    TELEGRAM_API_HASH?: string;
  }
}

interface ImportMetaEnv {
  readonly MAIN_VITE_TELEGRAM_API_ID: string;
  readonly MAIN_VITE_TELEGRAM_API_HASH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
