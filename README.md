# TAAS - Telegram As A Storage

<p align="center">
  <img src="apps/web/public/logo.svg" alt="TAAS Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Unlimited cloud storage powered by Telegram</strong>
</p>

<p align="center">
  Store any file, any size. No limits, no subscriptions.
</p>

---

## ✨ Features

- 🗂️ **Unlimited Storage** - Store files of any size using Telegram's infrastructure
- 📁 **Folder Organization** - Create folders and organize your files
- ⭐ **Star Important Files** - Quick access to your most-used files
- 🗑️ **Trash & Recovery** - Recover accidentally deleted files
- 🔒 **Secure** - Files stored in your private Telegram channel
- 📱 **Responsive UI** - Works on desktop and mobile
- 🌙 **Dark Mode** - Easy on the eyes

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- TypeScript
- Tailwind CSS
- Radix UI (Shadcn/ui)
- Framer Motion
- Zustand (State Management)
- React Query

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- GramJS (Telegram MTProto)
- PostgreSQL (Supabase)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database (Supabase recommended)
- Telegram API credentials

### 1. Get Telegram API Credentials

1. Go to [my.telegram.org/apps](https://my.telegram.org/apps)
2. Log in with your phone number
3. Create a new application
4. Note down your `api_id` and `api_hash`

### 2. Setup Supabase Database

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the URI (replace `[YOUR-PASSWORD]` with your password)

### 3. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/taas.git
cd taas

# Install dependencies
pnpm install
```

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

## 📁 Project Structure

```
TAAS/
├── apps/
│   ├── web/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/       # Page components
│   │   │   ├── stores/      # Zustand stores
│   │   │   ├── lib/         # Utilities & API
│   │   │   └── App.tsx      # Main app
│   │   └── ...
│   │
│   └── server/              # Express backend
│       ├── src/
│       │   ├── routes/      # API routes
│       │   ├── services/    # Business logic
│       │   ├── middleware/  # Express middleware
│       │   └── index.ts     # Server entry
│       └── prisma/          # Database schema
│
└── packages/
    └── shared/              # Shared types
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code & login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Files
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id/download` - Download file
- `POST /api/files/:id/star` - Toggle star
- `DELETE /api/files/:id` - Delete file

### Folders
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder
- `PATCH /api/folders/:id` - Rename folder
- `DELETE /api/folders/:id` - Delete folder

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

<p align="center">
  Made with ❤️ using Telegram's awesome infrastructure
</p>
