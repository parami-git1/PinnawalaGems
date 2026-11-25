const express = require('express');
const mongoose = require('mongoose');
const path = require('node:path');
if (require.main === module) require('dotenv').config({ quiet: true });

const cloudinary = require('cloudinary').v2;
const requireAdmin = require('./middleware/adminAuth');
const { configureProxy, secureHeaders, corsPolicy, apiCaching, apiLimiter, uploadLimiter, apiErrorHandler } = require('./middleware/security');
const { startupConfig, databaseStartupError, startupFailure, listenForConnections } = require('./utils/startup');

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

const app = express();
app.disable('x-powered-by');
app.use(secureHeaders);
app.use('/api', apiCaching);
app.use(corsPolicy);
app.use('/api', apiLimiter);
app.use(express.json({ limit: '100kb', strict: true, inflate: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { dotfiles: 'deny', maxAge: '1d', etag: true }));

const mediaRoutes = require('./routes/mediaRoutes');
app.post('/api/upload', requireAdmin, uploadLimiter, mediaRoutes.legacyImageUpload);
app.use('/api/media', mediaRoutes);
app.use('/api/gems', require('./routes/gemRoutes'));
app.use('/api/workshop', require('./routes/workshopRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/home', require('./routes/homeRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/event-ads', require('./routes/eventAdRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/admin', require('./routes/adminAuthRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/admin-notes', require('./routes/adminNoteRoutes'));
app.use('/api/planner', require('./routes/plannerRoutes'));

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'starting', database: connected ? 'connected' : 'unavailable', features: ['appointments', 'admin-notes', 'planner-notifications', 'gem-media', 'catalog-pagination', 'security-hardening', 'admin-session-verification', 'google-owner-policy'], revision: process.env.RENDER_GIT_COMMIT || null });
});

app.use('/api', (req, res) => res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl.split('?')[0]}` }));
app.get('/', (_req, res) => res.send('Pinnawala Gems API is running.'));
app.use(apiErrorHandler);

async function startServer() {
  const config = startupConfig();
  configureProxy(app);
  console.info('Backend startup: configuration validated; connecting to MongoDB.');
  try { await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000, family: 4 }); }
  catch (error) { throw databaseStartupError(error); }
  const server = await listenForConnections(app, config.port, config.host);
  server.requestTimeout = 150000;
  server.headersTimeout = 30000;
  console.info(`Pinnawala Gems API is listening on ${config.host}:${config.port}.`);
  return server;
}

if (require.main === module) startServer().catch(async (error) => {
  const failure = startupFailure(error);
  console.error(`Backend startup failed [${failure.code}]: ${failure.message}`);
  try { await mongoose.disconnect(); }
  catch { console.error('Backend cleanup could not finish after startup failure.'); }
  process.exitCode = 1;
});

module.exports = app;
module.exports.startServer = startServer;
