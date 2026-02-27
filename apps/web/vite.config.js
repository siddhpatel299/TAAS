import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
/**
 * Custom Vite plugin to provide a proper os polyfill for the telegram library.
 * The telegram library uses `import os from 'os'` which requires a default export
 * with a type() function that os-browserify doesn't provide.
 */
function osPolyfillPlugin() {
    var osPolyfillCode = "\n// Complete OS polyfill for telegram/GramJS browser support\nconst osMock = {\n  type: function() {\n    const ua = navigator.userAgent.toLowerCase();\n    if (ua.includes('win')) return 'Windows_NT';\n    if (ua.includes('mac')) return 'Darwin';\n    if (ua.includes('linux')) return 'Linux';\n    return 'Browser';\n  },\n  platform: function() {\n    const ua = navigator.userAgent.toLowerCase();\n    if (ua.includes('win')) return 'win32';\n    if (ua.includes('mac')) return 'darwin';\n    if (ua.includes('linux')) return 'linux';\n    return 'browser';\n  },\n  release: function() { return '1.0.0'; },\n  arch: function() { return 'x64'; },\n  hostname: function() { return 'browser'; },\n  homedir: function() { return '/'; },\n  tmpdir: function() { return '/tmp'; },\n  cpus: function() { return []; },\n  totalmem: function() { return 8589934592; },\n  freemem: function() { return 4294967296; },\n  networkInterfaces: function() { return {}; },\n  uptime: function() { return 0; },\n  loadavg: function() { return [0, 0, 0]; },\n  userInfo: function() { return { username: 'browser', uid: -1, gid: -1, shell: null, homedir: '/' }; },\n  endianness: function() { return 'LE'; },\n  EOL: '\\n'\n};\n// Export as both default and named exports for compatibility\nexport default osMock;\nexport const type = osMock.type;\nexport const platform = osMock.platform;\nexport const release = osMock.release;\nexport const arch = osMock.arch;\nexport const hostname = osMock.hostname;\nexport const homedir = osMock.homedir;\nexport const tmpdir = osMock.tmpdir;\nexport const cpus = osMock.cpus;\nexport const totalmem = osMock.totalmem;\nexport const freemem = osMock.freemem;\nexport const networkInterfaces = osMock.networkInterfaces;\nexport const uptime = osMock.uptime;\nexport const loadavg = osMock.loadavg;\nexport const userInfo = osMock.userInfo;\nexport const endianness = osMock.endianness;\nexport const EOL = osMock.EOL;\n";
    return {
        name: 'os-polyfill',
        enforce: 'pre',
        resolveId: function (id) {
            // Intercept any import of 'os' or 'node:os'
            if (id === 'os' || id === 'node:os') {
                return '\0virtual:os-polyfill';
            }
            return null;
        },
        load: function (id) {
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
});
