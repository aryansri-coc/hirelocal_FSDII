import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../../../apps/web/dist');

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
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Serve static frontend assets if built
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HireLocal Backend API',
    version: '1.0.0'
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

// Root welcome endpoint & redirect to frontend
app.get('/', (req, res) => {
  if (fs.existsSync(webDistPath)) {
    return res.sendFile(path.join(webDistPath, 'index.html'));
  }
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

// Single Page Application fallback for non-API client routes
if (fs.existsSync(webDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
