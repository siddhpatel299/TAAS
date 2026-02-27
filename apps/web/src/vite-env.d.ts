/// <reference types="vite/client" />

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  export class OrbitControls {
    constructor(camera: unknown, domElement: HTMLElement);
    enableZoom: boolean;
    enablePan: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    update(): void;
    dispose(): void;
  }
}

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
