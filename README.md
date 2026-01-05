<div align="center">

# 👑 TAAS
### Telegram As A Storage

<p>
  <img src="https://img.shields.io/badge/Storage-Unlimited-d4af37?style=for-the-badge&logo=telegram&logoColor=white" alt="Unlimited Storage"/>
  <img src="https://img.shields.io/badge/Price-FREE-d4af37?style=for-the-badge" alt="Free"/>
  <img src="https://img.shields.io/badge/Built_with-React_&_Node.js-d4af37?style=for-the-badge" alt="Tech Stack"/>
</p>

### ✨ *Luxury Cloud Storage, Powered by Telegram* ✨

Transform your Telegram into an **unlimited, secure cloud storage** with an elegant, professional interface. No subscriptions. No limits. Pure sophistication.

<p>
  <img src="https://img.shields.io/github/stars/yourusername/taas?style=social" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/yourusername/taas?style=social" alt="Forks"/>
</p>

</div>

---

## 🌟 Premium Features

<table>
<tr>
<td width="50%">

### ♾️ Infinite Storage
Leverage Telegram's infrastructure for **truly unlimited** file storage. Store files of any size, from documents to 4K videos.

### 🎨 Luxury Design
Refined glassmorphism with **gold accents** and smooth animations. A professional interface that feels premium.

### 🗂️ Smart Organization
Intuitive folder system with **drag-and-drop**, bulk actions, and intelligent file management.

</td>
<td width="50%">

### ⚡ Lightning Fast
Chunked uploads with **parallel processing**. Resume interrupted uploads seamlessly with version control.

### 🔐 Fort Knox Security
End-to-end encryption with **password-protected shares**. Your files stored privately in your Telegram channel.

### 🌍 Access Anywhere
**Responsive design** works flawlessly on desktop, tablet, and mobile. Your files, everywhere you go.

</td>
</tr>
</table>

---

## 💎 Tech Stack

<div align="center">

### Frontend Excellence
**React 18** • **TypeScript** • **Vite** • **Tailwind CSS** • **Framer Motion** • **Radix UI**

### Backend Power  
**Node.js** • **Express** • **Prisma ORM** • **GramJS** • **PostgreSQL**

</div>

---



## 🚀 Quick Start Guide

<details>
<summary><b>📋 Prerequisites</b></summary>
<br>

- **Node.js** 18 or higher
- **pnpm** 8 or higher  
- **PostgreSQL** database (Supabase recommended)
- **Telegram API** credentials

</details>

### 1️⃣ Get Telegram API Credentials

<div align="center">

```mermaid
graph LR
    A[Visit my.telegram.org] --> B[Login with Phone]
    B --> C[Create Application]
    C --> D[Get API ID & Hash]
```

</div>

1. Visit [my.telegram.org/apps](https://my.telegram.org/apps)
2. Log in with your phone number
3. Create a new application  
4. **Save** your `api_id` and `api_hash` securely

### 2️⃣ Setup Supabase Database

1. Create free account at [supabase.com](https://supabase.com) 🎁
2. Create a new project
3. Navigate: **Settings → Database → Connection string**
4. Copy the URI *(replace `[YOUR-PASSWORD]` with your password)*

### 3️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/taas.git
cd taas

# Install all dependencies
pnpm install
```

<div align="center">
<img src="https://img.shields.io/badge/⚡-Lightning_Fast_Install-d4af37?style=flat-square"/>
</div>

### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
```

Required environment variables:
```env
# Telegram API (from my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 5. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push
```

### 6. Run Development Servers

```bash
# Start both frontend and backend
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📦 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/web`
3. Add environment variable:
   - `VITE_API_URL`: Your backend URL

### Backend (Railway/Render)

1. Create a new web service
2. Set the root directory to `apps/server`
3. Build command: `pnpm install && pnpm db:generate && pnpm build`
4. Start command: `pnpm start`
5. Add all environment variables from `.env`

## 📁 Architecture

### System Overview

<div align="center">

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        UI["React Frontend<br/>(Vite + TypeScript)"]
        Store["Zustand State<br/>Management"]
    end

    subgraph Server["⚙️ API Layer"]
        API["Express.js API<br/>(REST Endpoints)"]
        Auth["Auth Middleware<br/>(JWT Validation)"]
        Services["Business Logic<br/>Services"]
    end

    subgraph Telegram["📱 Telegram Layer"]
        GramJS["GramJS Client"]
        Channel["Private Telegram<br/>Channel (Storage)"]
    end

    subgraph Database["🗄️ Data Layer"]
        Prisma["Prisma ORM"]
        PostgreSQL["PostgreSQL<br/>(Supabase)"]
    end

    UI <--> Store
    Store <-->|HTTP/REST| API
    API --> Auth
    Auth --> Services
    Services <--> GramJS
    GramJS <-->|MTProto| Channel
    Services <--> Prisma
    Prisma <--> PostgreSQL
```

</div>

### How It Works

<div align="center">

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🎨 Frontend
    participant A as ⚙️ API Server
    participant T as 📱 Telegram
    participant D as 🗄️ Database

    Note over U,D: 🔐 Authentication Flow
    U->>F: Enter phone number
    F->>A: POST /api/auth/send-code
    A->>T: Send verification code
    T-->>U: SMS/Telegram code
    U->>F: Enter code
    F->>A: POST /api/auth/verify-code
    A->>T: Verify & create session
    A->>D: Store encrypted session
    A-->>F: JWT token

    Note over U,D: 📤 File Upload Flow
    U->>F: Select file to upload
    F->>A: POST /api/files/upload
    A->>A: Chunk if > 2GB
    A->>T: Upload to private channel
    T-->>A: File ID & Message ID
    A->>D: Store file metadata
    A-->>F: Upload complete

    Note over U,D: 📥 File Download Flow
    U->>F: Click download
    F->>A: GET /api/files/:id/download
    A->>D: Get file metadata
    A->>T: Fetch from channel
    T-->>A: File buffer
    A->>A: Reassemble chunks if needed
    A-->>F: Stream file to user
```

</div>

### Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18, Vite, TypeScript | Luxury UI with glassmorphism design |
| **State** | Zustand, React Query | Client-side state & cache management |
| **API** | Express.js, TypeScript | RESTful endpoints with rate limiting |
| **Auth** | JWT, GramJS Sessions | Telegram-based authentication |
| **Storage** | GramJS, MTProto | File upload/download via Telegram API |
| **Database** | Prisma, PostgreSQL | Metadata, users, folders, share links |
| **Chunking** | Custom Service | Split files > 2GB into 1.9GB chunks |

### Data Flow Architecture

<div align="center">

```mermaid
flowchart LR
    subgraph Upload["📤 Upload Pipeline"]
        direction TB
        A1[File Input] --> A2[Validation]
        A2 --> A3{Size > 2GB?}
        A3 -->|Yes| A4[Chunk Service]
        A3 -->|No| A5[Direct Upload]
        A4 --> A6[Upload Chunks]
        A5 --> A6
        A6 --> A7[Store Metadata]
    end

    subgraph Storage["💾 Storage Layer"]
        direction TB
        B1[Telegram Channel]
        B2[PostgreSQL]
        B3[File Chunks Table]
    end

    subgraph Download["📥 Download Pipeline"]
        direction TB
        C1[Fetch Metadata] --> C2{Is Chunked?}
        C2 -->|Yes| C3[Download Chunks]
        C2 -->|No| C4[Direct Download]
        C3 --> C5[Reassemble]
        C4 --> C6[Stream to Client]
        C5 --> C6
    end

    Upload --> Storage
    Storage --> Download
```

</div>

### Project Structure

```
👑 TAAS/
├── 🎨 apps/web                    → React Frontend (Luxury UI)
│   ├── src/
│   │   ├── components/           → Reusable UI Components
│   │   │   └── ui/               → Radix UI Primitives
│   │   ├── pages/                → Route Pages (Dashboard, Login, etc.)
│   │   ├── stores/               → Zustand State Management
│   │   └── lib/                  → API Client & Utilities
│   └── ...
│
├── ⚙️ apps/server                 → Node.js Backend (API)
│   ├── src/
│   │   ├── routes/               → REST API Endpoints
│   │   │   ├── auth.routes.ts    → Authentication endpoints
│   │   │   ├── files.routes.ts   → File CRUD operations
│   │   │   ├── folders.routes.ts → Folder management
│   │   │   ├── share.routes.ts   → Share link management
│   │   │   └── sync.routes.ts    → Device sync
│   │   ├── services/             → Business Logic
│   │   │   ├── telegram.service  → Telegram API integration
│   │   │   ├── storage.service   → File storage operations
│   │   │   ├── chunk.service     → Large file chunking
│   │   │   └── version.service   → File versioning
│   │   ├── middleware/           → Auth & Error Handling
│   │   └── index.ts              → Express Server Entry
│   └── prisma/                   → Database Schema & Migrations
│
└── 📦 packages/shared             → Shared TypeScript Types
```

### Database Schema

<div align="center">

```mermaid
erDiagram
    User ||--o{ File : owns
    User ||--o{ Folder : owns
    User ||--o{ StorageChannel : has
    User ||--o{ SharedLink : creates
    
    Folder ||--o{ File : contains
    Folder ||--o{ Folder : "parent-child"
    
    File ||--o{ FileChunk : "split into"
    File ||--o{ FileVersion : "has versions"
    File ||--o{ SharedLink : "shared via"

    User {
        string id PK
        string telegramId UK
        string username
        string sessionData "encrypted"
    }
    
    File {
        string id PK
        string name
        bigint size
        string telegramFileId
        int telegramMessageId
        boolean isChunked
        string checksum
    }
    
    FileChunk {
        string id PK
        int chunkIndex
        string telegramFileId
        bigint size
    }
    
    Folder {
        string id PK
        string name
        string parentId FK
        string color
    }
    
    SharedLink {
        string id PK
        string token UK
        datetime expiresAt
        string password
        int maxDownloads
    }
```

</div>

---

## 📱 Telegram Chat Import

Import files directly from your Telegram chats, groups, and channels into TAAS with a single click.

### ✨ Key Features

- **Browse Chats**: View all your Telegram conversations
- **File Preview**: See files shared in any chat
- **One-Click Import**: Import individual files to TAAS
- **Folder Selection**: Choose destination folder

### 🔄 Streaming Architecture (Memory Efficient)

Files are transferred using **streaming** - they flow directly from Telegram to storage without loading the entire file into server memory.

<div align="center">

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  TELEGRAM       │ ──────▶ │  TAAS SERVER    │ ──────▶ │  TAAS STORAGE   │
│  SERVERS        │  stream │  (512KB chunks) │  stream │  (Telegram)     │
│                 │         │  Minimal RAM    │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                   ▲
                                   │ Only sends
                                   │ "import" command
                            ┌──────┴──────┐
                            │   USER'S    │
                            │   BROWSER   │
                            └─────────────┘
```

</div>

### How Streaming Works

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant B as 🌐 Browser  
    participant S as ⚙️ Server
    participant T1 as 📱 Source Chat
    participant T2 as 📦 Storage Channel

    U->>B: Click "Import" on file
    B->>S: POST /telegram/.../import
    Note over S: No file data sent!
    
    S->>T1: Start streaming download
    
    loop 512KB Chunks
        T1-->>S: Chunk N
        S->>T2: Stream chunk to storage
        Note over S: Only 512KB in RAM
    end
    
    T2-->>S: Upload complete
    S->>S: Save metadata to DB
    S-->>B: Success response
    B->>U: "File imported!" ✅
```

### Memory Comparison

| Approach | 100MB File | 1GB File | 4GB File |
|----------|------------|----------|----------|
| **Old (Buffer)** | 100MB RAM | 1GB RAM | 4GB RAM ❌ |
| **New (Stream)** | ~512KB RAM | ~512KB RAM | ~512KB RAM ✅ |

### Design Rules

| Rule | Implementation |
|------|----------------|
| **Manual only** | User must click "Import" button |
| **One file per action** | API accepts single `messageId` |
| **Streaming transfer** | File never fully loaded to RAM |
| **No bulk/batch** | No array operations |
| **No background sync** | No watchers, no polling |

---

## 🔒 Security Architecture

TAAS implements defense-in-depth security with **zero-knowledge encryption**. Your files are encrypted before they ever leave your browser.

### Security Overview

<div align="center">

```mermaid
flowchart TB
    subgraph Client["🖥️ Client (Browser)"]
        direction TB
        P["User Passphrase"] --> KDF["PBKDF2 Key Derivation<br/>(600,000 iterations)"]
        KDF --> MK["Master Key<br/>(AES-256)"]
        MK --> EFK["Encrypt File Keys"]
        
        F["File"] --> E["AES-256-GCM<br/>Encryption"]
        E --> H["SHA-256 Hash<br/>per Chunk"]
    end

    subgraph Server["⚙️ Server"]
        direction TB
        META["Store Metadata Only"]
        SALT["Salt + Verification Hash"]
        EK["Encrypted File Keys"]
    end

    subgraph Telegram["📱 Telegram"]
        direction TB
        BLOB["Encrypted Blobs<br/>(Unreadable)"]
    end

    H -->|"Encrypted Only"| BLOB
    EFK --> EK
    KDF --> SALT

    style MK fill:#d4af37
    style P fill:#22c55e
```

</div>

### 🔐 Encryption Model

| Layer | Algorithm | Purpose |
|-------|-----------|---------|
| **Key Derivation** | PBKDF2-SHA256 (600K iterations) | Derive master key from passphrase |
| **File Encryption** | AES-256-GCM | Encrypt file content with authentication |
| **Key Encryption** | AES-256-GCM | Encrypt per-file keys with master key |
| **Integrity** | SHA-256 | Hash verification for every chunk |
| **Transport** | HTTPS + MTProto | Secure data transmission |

### 🛡️ Security Guarantees

```
✅ Zero-Knowledge: Server never sees your passphrase or master key
✅ Client-Side Encryption: Files encrypted BEFORE upload
✅ Per-File Keys: Each file has a unique encryption key
✅ Integrity Verification: SHA-256 hash checked on every chunk
✅ No Plaintext Storage: Only encrypted blobs stored on Telegram
✅ Forward Secrecy: Compromising one file key doesn't expose others
```

### Secure Upload Flow

<div align="center">

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant B as 🌐 Browser
    participant S as ⚙️ Server
    participant T as 📱 Telegram

    Note over U,T: 🔐 Client-Side Encryption (Browser)
    U->>B: Select file + Enter passphrase
    B->>B: Derive master key (PBKDF2)
    B->>B: Generate random file key (AES-256)
    B->>B: Encrypt file with file key
    B->>B: Encrypt file key with master key
    B->>B: Calculate SHA-256 hash per chunk

    Note over U,T: 📤 Throttled Upload (Anti-Detection)
    B->>S: Send encrypted chunk + hash
    S->>S: Apply rate limiting + jitter
    S->>S: Wait 500-2000ms between chunks
    S->>T: Upload encrypted blob
    T-->>S: Message ID
    S->>S: Store metadata + encrypted key
    S-->>B: Chunk confirmed

    Note over U,T: ✅ Verification
    B->>B: Verify all chunks uploaded
    S-->>B: Upload complete
```

</div>

### Secure Download & Recovery Flow

<div align="center">

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant B as 🌐 Browser
    participant S as ⚙️ Server
    participant T as 📱 Telegram

    Note over U,T: 📥 Download Encrypted Chunks
    U->>B: Request file + Enter passphrase
    B->>S: GET /files/:id/metadata
    S-->>B: Encrypted file key + chunk info
    
    loop For each chunk
        B->>S: GET /files/:id/chunk/:index
        S->>T: Fetch encrypted blob
        T-->>S: Encrypted data
        S-->>B: Chunk + expected hash
        B->>B: Verify SHA-256 hash
        B->>B: FAIL LOUDLY if mismatch ❌
    end

    Note over U,T: 🔓 Client-Side Decryption
    B->>B: Derive master key (PBKDF2)
    B->>B: Decrypt file key with master key
    B->>B: Decrypt & reassemble chunks
    B->>B: Verify final file hash
    B-->>U: Decrypted file ✅
```

</div>

### 🕵️ Anti-Detection Measures

TAAS implements human-like behavior to avoid triggering Telegram's abuse detection:

| Measure | Implementation |
|---------|----------------|
| **Sequential Uploads** | Chunks uploaded one at a time, never parallel |
| **Random Delays** | 500-2000ms jitter between chunk uploads |
| **Rate Limiting** | Max 10 chunks/minute with cooldown periods |
| **Random Channel Names** | Unique names like `MyFiles_x7k2a3b` per user |
| **Progress-Based Delay** | Slower uploads as file progresses (mimics fatigue) |

### 🔑 Key Management

```typescript
// Key derivation from passphrase (client-side only)
const masterKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: userSalt,
    iterations: 600000,  // High iteration count
    hash: 'SHA-256',
  },
  passphraseKey,
  { name: 'AES-GCM', length: 256 },
  false,  // NOT extractable - never leaves memory
  ['encrypt', 'decrypt']
);
```

### 📦 Recovery Model

Files can be fully recovered using only:
1. **Encrypted chunks** from Telegram
2. **Metadata** from the database  
3. **User passphrase** (memorized)

```typescript
// Export recovery metadata for backup
const backup = await recoveryService.exportFullBackup(userId);
// Contains: encrypted file keys, chunk hashes, channel IDs
// Does NOT contain: passphrase, master key, plaintext data
```

### What the Server Knows vs. Doesn't Know

| Server Knows ✓ | Server CANNOT Access ✗ |
|----------------|------------------------|
| File names & sizes | File contents |
| Encrypted file keys | Master key |
| Salt for key derivation | Passphrase |
| SHA-256 hashes | Decrypted data |
| Telegram message IDs | Encryption keys |

## 🔧 API Reference

<details>
<summary><b>🔐 Authentication</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/send-code` | Send verification code |
| `POST` | `/api/auth/verify-code` | Verify code & login |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Logout |

</details>

<details>
<summary><b>📁 Files</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/files` | List all files |
| `POST` | `/api/files/upload` | Upload new file |
| `GET` | `/api/files/:id/download` | Download file |
| `POST` | `/api/files/:id/star` | Toggle star status |
| `DELETE` | `/api/files/:id` | Delete file |

</details>

<details>
<summary><b>🗂️ Folders</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/folders` | List all folders |
| `POST` | `/api/folders` | Create new folder |
| `PATCH` | `/api/folders/:id` | Rename folder |
| `DELETE` | `/api/folders/:id` | Delete folder |

</details>

## 🤝 Contributing

<div align="center">

Contributions, issues, and feature requests are **welcome**!

Feel free to check the [issues page](https://github.com/yourusername/taas/issues).

</div>

## 📄 License

<div align="center">

**MIT License** — Free for personal and commercial use

[![License: MIT](https://img.shields.io/badge/License-MIT-d4af37.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

<div align="center">

### 👑 Built with Excellence

*Powered by Telegram's Infrastructure*

**[⭐ Star this repo](https://github.com/yourusername/taas)** • **[🐛 Report Bug](https://github.com/yourusername/taas/issues)** • **[✨ Request Feature](https://github.com/yourusername/taas/issues)**

<img src="https://img.shields.io/badge/Made_with-❤️_&_☕-d4af37?style=for-the-badge"/>

</div>
