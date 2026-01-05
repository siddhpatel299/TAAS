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

<div align="center">

```
👑 TAAS/
├── 🎨 apps/web                    → React Frontend (Luxury UI)
│   ├── src/
│   │   ├── components/           → Reusable Components
│   │   ├── pages/                → Route Pages
│   │   ├── stores/               → State Management
│   │   └── lib/                  → API & Utilities
│   └── ...
│
├── ⚙️ apps/server                 → Node.js Backend (API)
│   ├── src/
│   │   ├── routes/               → REST Endpoints
│   │   ├── services/             → Business Logic
│   │   ├── middleware/           → Auth & Error Handling
│   │   └── index.ts              → Server Entry
│   └── prisma/                   → Database Schema
│
└── 📦 packages/shared             → Shared TypeScript Types
```

</div>

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
