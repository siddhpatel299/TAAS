/**
 * OS module shim for browser environment
 * Required by telegram/GramJS library
 */

export function type(): string {
  return 'Browser';
}

export function platform(): string {
  return 'browser';
}

export function arch(): string {
  return 'wasm32';
}

export function release(): string {
  return '1.0.0';
}

export function hostname(): string {
  return 'browser';
}

export function homedir(): string {
  return '/';
}

export function tmpdir(): string {
  return '/tmp';
}

export function cpus(): Array<{ model: string; speed: number }> {
  return [{ model: 'Browser', speed: 0 }];
}

export function totalmem(): number {
  return 4 * 1024 * 1024 * 1024; // 4GB
}

export function freemem(): number {
  return 2 * 1024 * 1024 * 1024; // 2GB
}

export function networkInterfaces(): Record<string, unknown> {
  return {};
}

export function endianness(): string {
  return 'LE';
}

export const EOL = '\n';

// Default export for CommonJS compatibility
export default {
  type,
  platform,
  arch,
  release,
  hostname,
  homedir,
  tmpdir,
  cpus,
  totalmem,
  freemem,
  networkInterfaces,
  endianness,
  EOL,
};
