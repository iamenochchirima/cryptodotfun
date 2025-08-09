import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import IORedis from "ioredis"; 
import { getHealth, getStatus } from './src/controllers/healthController';
import authRoutes from './src/routes/authRoutes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8080;


// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// Health check endpoints
app.get('/health', getHealth);
app.get('/status', getStatus);

const redisClient = new IORedis(process.env.REDIS_URL!);

const redisConnectionPromise = new Promise<void>((resolve, reject) => {
  redisClient.on("connect", () => {
    console.log("✅ Redis connected 🚀");
    resolve();
  });

  redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
    reject(err);
  });
});
export { redisClient, redisConnectionPromise };

// Authentication routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
    availableEndpoints: [
      'GET /health - Server health check',
      'GET /status - API status',
      'POST /api/auth/initiate - Start authentication flow',
      'GET /api/auth/verify/:sessionId - Verify user identity',
      'GET /api/auth/session/:sessionId - Get session status',
      'GET /api/auth/documentation - Get canister documentation'
    ]
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Authentication server running on port ${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   GET  /health - Server health check`);
  console.log(`   GET  /status - API status`);
  console.log(`   POST /api/auth/initiate - Start authentication flow`);
  console.log(`   GET  /api/auth/verify/:sessionId - Verify user identity`);
  console.log(`   GET  /api/auth/session/:sessionId - Get session status`);
  console.log(`   GET  /api/auth/documentation - Get canister documentation`);
  console.log(`🔐 IC Identity Certifier integration active`);
});

export default app;
