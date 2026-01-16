import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

/**
 * Custom Vite plugin to provide a proper os polyfill for the telegram library.
 * The telegram library uses `import os from 'os'` which requires a default export
 * with a type() function that os-browserify doesn't provide.
 */
function osPolyfillPlugin(): Plugin {
  const osPolyfillCode = `
// Complete OS polyfill for telegram/GramJS browser support
const osMock = {
  type: function() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'Windows_NT';
    if (ua.includes('mac')) return 'Darwin';
    if (ua.includes('linux')) return 'Linux';
    return 'Browser';
  },
  platform: function() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'win32';
    if (ua.includes('mac')) return 'darwin';
    if (ua.includes('linux')) return 'linux';
    return 'browser';
  },
  release: function() { return '1.0.0'; },
  arch: function() { return 'x64'; },
  hostname: function() { return 'browser'; },
  homedir: function() { return '/'; },
  tmpdir: function() { return '/tmp'; },
  cpus: function() { return []; },
  totalmem: function() { return 8589934592; },
  freemem: function() { return 4294967296; },
  networkInterfaces: function() { return {}; },
  uptime: function() { return 0; },
  loadavg: function() { return [0, 0, 0]; },
  userInfo: function() { return { username: 'browser', uid: -1, gid: -1, shell: null, homedir: '/' }; },
  endianness: function() { return 'LE'; },
  EOL: '\\n'
};
// Export as both default and named exports for compatibility
export default osMock;
export const type = osMock.type;
export const platform = osMock.platform;
export const release = osMock.release;
export const arch = osMock.arch;
export const hostname = osMock.hostname;
export const homedir = osMock.homedir;
export const tmpdir = osMock.tmpdir;
export const cpus = osMock.cpus;
export const totalmem = osMock.totalmem;
export const freemem = osMock.freemem;
export const networkInterfaces = osMock.networkInterfaces;
export const uptime = osMock.uptime;
export const loadavg = osMock.loadavg;
export const userInfo = osMock.userInfo;
export const endianness = osMock.endianness;
export const EOL = osMock.EOL;
`;

  return {
    name: 'os-polyfill',
    enforce: 'pre',
    resolveId(id) {
      // Intercept any import of 'os' or 'node:os'
      if (id === 'os' || id === 'node:os') {
        return '\0virtual:os-polyfill';
      }
      return null;
    },
    load(id) {
      if (id === '\0virtual:os-polyfill') {
        return osPolyfillCode;
      }
      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Our custom OS polyfill must come FIRST
    osPolyfillPlugin(),
    react(),
    // Node polyfills for other modules (excluding os since we handle it)
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'events', 'path'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
      overrides: {
        process: 'process/browser',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'process': 'process/browser',
    },
  },
  define: {
    'process.env': JSON.stringify({}),
    'process.browser': true,
    'process.version': JSON.stringify(''),
    'process.platform': JSON.stringify('browser'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['telegram', 'big-integer', 'buffer', 'process/browser'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
