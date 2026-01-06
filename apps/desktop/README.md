# TAAS Desktop

Cross-platform desktop client for TAAS (Telegram As A Storage) with safe, intent-aware folder synchronization.

## Features

- **Folder Sync**: Watch and sync selected local folders to your Telegram storage channel
- **End-to-End Encryption**: All files encrypted locally with AES-256-GCM before upload
- **Human-Like Behavior**: Configurable delays and jitter to avoid Telegram abuse detection
- **Full Control**: Explicit enable/disable, pause/resume, per-folder control
- **Visible Queue**: See exactly what's pending, uploading, or completed

## ⚠️ Important: Telegram Safety

This app is designed to be **polite to Telegram**. It does NOT:

- Upload files instantly or in batches
- Run background sync when closed
- Start automatically on boot
- Mirror entire directories immediately
- Upload without user awareness

Instead, it:

- Waits 30-120 seconds (configurable) before uploading changed files
- Uploads one file at a time, sequentially
- Adds random jitter to timing to appear human
- Pauses on errors and requires manual intervention
- Shows all activity in the UI

## Setup

### Prerequisites

1. Get Telegram API credentials from [my.telegram.org](https://my.telegram.org)
2. Node.js 18+ and pnpm

### Installation

```bash
# From the monorepo root
pnpm install

# Navigate to desktop app
cd apps/desktop

# Set environment variables
export TELEGRAM_API_ID=your_api_id
export TELEGRAM_API_HASH=your_api_hash

# Run in development
pnpm dev
```

### Building

```bash
# Build for current platform
pnpm dist

# Build for specific platforms
pnpm dist:mac
pnpm dist:win
pnpm dist:linux
```

## Architecture

```
apps/desktop/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Entry point, window management
│   │   └── services/
│   │       ├── sync-manager.ts      # Core sync orchestration
│   │       ├── folder-watcher.ts    # OS-native file watching
│   │       ├── encryption-service.ts # Local AES-256-GCM encryption
│   │       ├── telegram-service.ts  # GramJS/MTProto integration
│   │       └── store-service.ts     # Persistent local storage
│   │
│   ├── preload/        # Secure IPC bridge
│   │   └── index.ts    # Context-isolated API
│   │
│   ├── renderer/       # React UI
│   │   └── src/
│   │       ├── components/  # UI components
│   │       └── stores/      # Zustand state management
│   │
│   └── shared/         # Shared types
│       └── types.ts    # Type definitions
```

## Sync Behavior

### How it works:

1. **User selects folders** to watch (not automatic)
2. **User enables sync** (explicit action required)
3. When a file is added/changed:
   - Added to upload queue
   - Waits configurable delay (30-120s default)
   - Random jitter added to timing
4. **Sequential uploads** (one at a time)
5. **Encryption before upload** (never plaintext)
6. **Stops on errors** (no silent failures)

### Timing Configuration:

| Setting | Default | Description |
|---------|---------|-------------|
| Min Delay | 30s | Minimum wait before upload |
| Max Delay | 120s | Maximum wait before upload |
| Jitter Factor | 30% | Random variation in timing |

## Security

- **AES-256-GCM encryption** for all files
- **Keys stored only locally** (never transmitted)
- **Per-file unique encryption keys** (derived from master key)
- **Integrity verification** via SHA-256 hashes
- **Session stored encrypted** locally

## Non-Negotiable Rules

This app will NEVER:

1. ❌ Upload without explicit user action
2. ❌ Run background sync outside the app
3. ❌ Start automatically on boot
4. ❌ Upload in parallel (always sequential)
5. ❌ Upload instantly (always delayed)
6. ❌ Continue on errors silently
7. ❌ Sync folders not explicitly selected
8. ❌ Store plaintext files or keys on servers

## License

MIT
