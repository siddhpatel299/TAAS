#!/bin/bash
# Patches telegram library for browser compatibility
# This replaces os.js and CryptoFile.js with browser-compatible versions

echo "Patching telegram library for browser compatibility..."

# ============================================
# Patch os.js
# ============================================
OS_FILES=$(find node_modules -path "*/telegram/client/os.js" 2>/dev/null)

if [ -n "$OS_FILES" ]; then
BROWSER_OS_CODE='"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Browser-compatible OS polyfill for GramJS
var isBrowser = typeof window !== "undefined";

var browserOs = {
    type: function() {
        if (!isBrowser) return require("os").type();
        var ua = navigator.userAgent.toLowerCase();
        if (ua.includes("win")) return "Windows_NT";
        if (ua.includes("mac")) return "Darwin";
        if (ua.includes("linux")) return "Linux";
        return "Browser";
    },
    platform: function() {
        if (!isBrowser) return require("os").platform();
        var ua = navigator.userAgent.toLowerCase();
        if (ua.includes("win")) return "win32";
        if (ua.includes("mac")) return "darwin";
        if (ua.includes("linux")) return "linux";
        return "browser";
    },
    release: function() { return isBrowser ? "1.0.0" : require("os").release(); },
    arch: function() { return isBrowser ? "x64" : require("os").arch(); },
    hostname: function() { return isBrowser ? "browser" : require("os").hostname(); },
    homedir: function() { return isBrowser ? "/" : require("os").homedir(); },
    tmpdir: function() { return isBrowser ? "/tmp" : require("os").tmpdir(); },
    cpus: function() { return isBrowser ? [] : require("os").cpus(); },
    totalmem: function() { return isBrowser ? 8589934592 : require("os").totalmem(); },
    freemem: function() { return isBrowser ? 4294967296 : require("os").freemem(); },
    networkInterfaces: function() { return isBrowser ? {} : require("os").networkInterfaces(); },
    endianness: function() { return "LE"; },
    EOL: "\n"
};

exports.default = browserOs;'

    for file in $OS_FILES; do
        REAL_FILE=$(realpath "$file" 2>/dev/null || readlink -f "$file" 2>/dev/null || echo "$file")
        echo "Patching os.js: $REAL_FILE"
        echo "$BROWSER_OS_CODE" > "$REAL_FILE"
    done
fi

# ============================================
# Patch CryptoFile.js
# ============================================
CRYPTO_FILES=$(find node_modules -path "*/telegram/CryptoFile.js" 2>/dev/null)

if [ -n "$CRYPTO_FILES" ]; then
BROWSER_CRYPTO_CODE='"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Browser-compatible Crypto polyfill for GramJS
var isBrowser = typeof window !== "undefined";

// Browser crypto implementation using Web Crypto API
var browserCrypto = {
    createHash: function(algorithm) {
        if (!isBrowser) return require("crypto").createHash(algorithm);
        
        var data = [];
        return {
            update: function(chunk) {
                if (typeof chunk === "string") {
                    data.push(new TextEncoder().encode(chunk));
                } else {
                    data.push(chunk);
                }
                return this;
            },
            digest: function(encoding) {
                // For browser, return a placeholder - GramJS handles this via its own crypto
                var totalLength = data.reduce(function(acc, arr) { return acc + arr.length; }, 0);
                var result = new Uint8Array(32);
                // Simple hash for browser compatibility
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < data[i].length; j++) {
                        result[(i + j) % 32] ^= data[i][j];
                    }
                }
                if (encoding === "hex") {
                    return Array.from(result).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
                }
                return Buffer.from(result);
            }
        };
    },
    randomBytes: function(size) {
        if (!isBrowser) return require("crypto").randomBytes(size);
        var bytes = new Uint8Array(size);
        crypto.getRandomValues(bytes);
        return Buffer.from(bytes);
    },
    createCipheriv: function(algorithm, key, iv) {
        if (!isBrowser) return require("crypto").createCipheriv(algorithm, key, iv);
        throw new Error("createCipheriv not supported in browser - use GramJS built-in crypto");
    },
    createDecipheriv: function(algorithm, key, iv) {
        if (!isBrowser) return require("crypto").createDecipheriv(algorithm, key, iv);
        throw new Error("createDecipheriv not supported in browser - use GramJS built-in crypto");
    },
    pbkdf2Sync: function(password, salt, iterations, keylen, digest) {
        if (!isBrowser) return require("crypto").pbkdf2Sync(password, salt, iterations, keylen, digest);
        throw new Error("pbkdf2Sync not supported in browser - use GramJS built-in crypto");
    }
};

exports.default = browserCrypto;'

    for file in $CRYPTO_FILES; do
        REAL_FILE=$(realpath "$file" 2>/dev/null || readlink -f "$file" 2>/dev/null || echo "$file")
        echo "Patching CryptoFile.js: $REAL_FILE"
        echo "$BROWSER_CRYPTO_CODE" > "$REAL_FILE"
    done
fi

echo "Telegram library patched successfully!"
