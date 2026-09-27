import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import callbotRoutes from './routes/callbotRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import pincodeRoutes from './routes/pincodeRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root welcome endpoint & redirect to frontend
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect('http://localhost:5173');
  }
  res.json({
    name: 'HireLocal API',
    status: 'running',
    frontend: 'http://localhost:5173',
    health: '/api/health'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'HireLocal API',
    status: 'running',
    version: '1.0.0',
    frontend: 'http://localhost:5173',
    health: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HireLocal Backend API',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/callbot', callbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pincode', pincodeRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 HireLocal API Server running on port ${PORT}`);
  console.log(`💻 Web Frontend: http://localhost:5173`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
