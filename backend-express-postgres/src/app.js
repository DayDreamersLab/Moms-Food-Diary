import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import authRoutes from './routes/auth.js';
import likeRoutes from './routes/likes.js';
import postRoutes from './routes/posts.js';
import profileRoutes from './routes/profiles.js';
import searchRoutes from './routes/search.js';
import uploadRoutes from './routes/uploads.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(path.resolve(config.uploadDir)));

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/auth', authRoutes);
  app.use('/posts', postRoutes);
  app.use(likeRoutes);
  app.use('/profiles', profileRoutes);
  app.use('/search', searchRoutes);
  app.use('/uploads', uploadRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
