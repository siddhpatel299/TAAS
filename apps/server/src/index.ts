import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import filesRoutes from './routes/files.routes';
import foldersRoutes from './routes/folders.routes';
import shareRoutes from './routes/share.routes';
import syncRoutes from './routes/sync.routes';
import telegramRoutes from './routes/telegram.routes';
import pluginsRoutes from './routes/plugins.routes';
import jobTrackerRoutes from './routes/job-tracker.routes';
import todoRoutes from './routes/todo.routes';
import notesRoutes from './routes/notes.routes';
import { nexusRouter } from './routes/nexus.routes';
import flowRoutes from './routes/flow.routes';
import { searchRoutes } from './routes/search.routes';
import { crmRouter } from './routes/crm.routes';
import callReminderRoutes from './routes/call-reminder.routes';
import subscriptionRoutes from './routes/subscription.routes';
import pdfToolsRoutes from './routes/pdf-tools.routes';
import { flowService } from './services/flow.service';
import { callScheduler } from './jobs/call-scheduler';

const app: Application = express();

// Trust proxy for Render, Railway, Vercel, etc (behind reverse proxy)
// This is required for express-rate-limit to work correctly
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Normalize frontend URL (remove trailing slash)
const frontendUrl = config.frontendUrl?.replace(/\/$/, '') || '*';

// Allowed origins
const allowedOrigins = [
  frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://taas-ten.vercel.app', // Vercel Production
  'https://taas-git-main-siddhpatel299s-projects.vercel.app' // Vercel Preview
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow browser extension requests (Chrome/Firefox)
    if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
}));

// Rate limiting - different limits for different routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit auth requests (relaxed for dev)
  message: { success: false, error: 'Too many requests, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute for general API (notes auto-save)
  message: { success: false, error: 'Too many requests, please try again later' },
});

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute  
  max: 60, // 60 requests per minute for public share routes
  message: { success: false, error: 'Too many requests, please try again later' },
});

// Body parsing with increased limits for email attachments
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes with appropriate rate limits
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/files', apiLimiter, filesRoutes);
app.use('/api/folders', apiLimiter, foldersRoutes);
app.use('/api/share/public', publicLimiter); // Public share routes - less strict
app.use('/api/share', apiLimiter, shareRoutes);
app.use('/api/sync', apiLimiter, syncRoutes);
app.use('/api/telegram', apiLimiter, telegramRoutes);
app.use('/api/plugins', apiLimiter, pluginsRoutes);
app.use('/api/job-tracker', apiLimiter, jobTrackerRoutes);
app.use('/api/crm', apiLimiter, crmRouter); // Register CRM routes
app.use('/api/todo', apiLimiter, todoRoutes);
app.use('/api/notes', apiLimiter, notesRoutes);
app.use('/api/nexus', apiLimiter, nexusRouter);
app.use('/api/flow', apiLimiter, flowRoutes);
app.use('/api/search', apiLimiter, searchRoutes);
app.use('/api/subscriptions', apiLimiter, subscriptionRoutes);
app.use('/api/call-reminders', apiLimiter, callReminderRoutes);
app.use('/api/pdf-tools', apiLimiter, pdfToolsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Flow Scheduler
flowService.initScheduler().catch(err => console.error('Failed to init Flow Scheduler:', err));

// Initialize Call Reminder Scheduler
callScheduler.start();

// Prevent crash on unhandled promise rejection (e.g. Telegram ETIMEDOUT during upload)
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled rejection:', reason);
  // Don't exit - let the request fail and client retry
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`
  🚀 TAAS Server is running!
  📡 Port: ${config.port}
  🌍 Environment: ${config.nodeEnv}
  🔗 Frontend URL: ${config.frontendUrl}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
