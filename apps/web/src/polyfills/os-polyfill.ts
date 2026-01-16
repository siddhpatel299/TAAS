/**
 * Browser polyfill for Node.js 'os' module
 * 
 * This provides the methods needed by the telegram (GramJS) library
 * that are not available in os-browserify.
 */

// Get OS type - GramJS uses this for connection info
export function type(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('win')) {
        return 'Windows_NT';
    } else if (userAgent.includes('mac')) {
        return 'Darwin';
    } else if (userAgent.includes('linux')) {
        return 'Linux';
    } else if (userAgent.includes('android')) {
        return 'Linux';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        return 'Darwin';
    }

    return 'Browser';
}

// Get platform
export function platform(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('win')) {
        return 'win32';
    } else if (userAgent.includes('mac')) {
        return 'darwin';
    } else if (userAgent.includes('linux') || userAgent.includes('android')) {
        return 'linux';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        return 'darwin';
    }

    return 'browser';
}

// Get release version
export function release(): string {
    return '1.0.0';
}

// Get architecture
export function arch(): string {
    return 'x64';
}

// Get hostname
export function hostname(): string {
    return window.location.hostname || 'browser';
}

// Get home directory
export function homedir(): string {
    return '/';
}

// Get temp directory
export function tmpdir(): string {
    return '/tmp';
}

// Get EOL character
export const EOL = '\n';

// Get CPU info (stub)
export function cpus() {
    return [];
}

// Get total memory (stub)
export function totalmem(): number {
    // Return 8GB as default
    return 8 * 1024 * 1024 * 1024;
}

// Get free memory (stub)
export function freemem(): number {
    // Return 4GB as default
    return 4 * 1024 * 1024 * 1024;
}

// Get network interfaces (stub)
export function networkInterfaces() {
    return {};
}

// Get uptime (stub)
export function uptime(): number {
    return 0;
}

// Get load average (stub)
export function loadavg(): number[] {
    return [0, 0, 0];
}

// Get user info (stub)
export function userInfo() {
    return {
        username: 'browser',
        uid: -1,
        gid: -1,
        shell: null,
        homedir: '/',
    };
}

// Get endianness
export function endianness(): string {
    const buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256 ? 'LE' : 'BE';
}

// Export default object with all methods
export default {
    type,
    platform,
    release,
    arch,
    hostname,
    homedir,
    tmpdir,
    EOL,
    cpus,
    totalmem,
    freemem,
    networkInterfaces,
    uptime,
    loadavg,
    userInfo,
    endianness,
};
