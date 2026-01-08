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
import passwordVaultRoutes from './routes/password-vault.routes';

const app: Application = express();

// Trust proxy for Render, Railway, Vercel, etc (behind reverse proxy)
// This is required for express-rate-limit to work correctly
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Normalize frontend URL (remove trailing slash)
const frontendUrl = config.frontendUrl?.replace(/\/$/, '') || '*';

app.use(cors({
  origin: frontendUrl === '*' ? '*' : frontendUrl,
  credentials: true,
}));

// Rate limiting - different limits for different routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit auth requests (SMS codes are expensive)
  message: { success: false, error: 'Too many requests, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for general API
  message: { success: false, error: 'Too many requests, please try again later' },
});

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute  
  max: 60, // 60 requests per minute for public share routes
  message: { success: false, error: 'Too many requests, please try again later' },
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/todo', apiLimiter, todoRoutes);
app.use('/api/password-vault', apiLimiter, passwordVaultRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

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
