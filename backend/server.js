const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
if (require.main === module) require('dotenv').config();

// 🔹 අලුතින් Cloudinary පැකේජ් ටික ගෙන්න ගත්තා
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const requireAdmin = require('./middleware/adminAuth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Cloudinary Configuration (අපි .env එකේ දාපු විස්තර)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🔹 අලුත් Cloudinary Storage එක (මේකෙන් ෆොටෝ එක කෙලින්ම Cloud එකට යවනවා)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pinnawala_gems', // Cloudinary එකේ මේ නමින් ෆෝල්ඩරයක් හැදෙයි
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});

const upload = multer({ storage });

// Image Upload API (Cloudinary එකට ගියාට පස්සේ එන ලින්ක් එක Frontend එකට යවනවා)
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // req.file.path කියන එක ඇතුළේ තියෙන්නේ කවදාවත් මැකෙන්නේ නැති Cloudinary ලින්ක් එක!
  const imageUrl = req.file.path;
  res.json({ imageUrl });
});

app.use('/api/media', require('./routes/mediaRoutes'));

const gemRoutes = require('./routes/gemRoutes');
app.use('/api/gems', gemRoutes); 

const workshopRoutes = require('./routes/workshopRoutes');
app.use('/api/workshop', workshopRoutes);

const feedbackRoutes = require('./routes/feedbackRoutes');
app.use('/api/feedback', feedbackRoutes);

const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);

// 👇 ALUTHIN ADD KARAPU TIKA 👇
const homeRoutes = require('./routes/homeRoutes'); 
app.use('/api/home', homeRoutes); 
// 👆 ALUTHIN ADD KARAPU TIKA 👆

const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

const stockRoutes = require('./routes/stockRoutes');
app.use('/api/stock', stockRoutes);

const eventAdRoutes = require('./routes/eventAdRoutes');
app.use('/api/event-ads', eventAdRoutes);

const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

const adminAuthRoutes = require('./routes/adminAuthRoutes');
app.use('/api/admin', adminAuthRoutes);

const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

const adminNoteRoutes = require('./routes/adminNoteRoutes');
app.use('/api/admin-notes', adminNoteRoutes);

const plannerRoutes = require('./routes/plannerRoutes');
app.use('/api/planner', plannerRoutes);



app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'starting',
    database: connected ? 'connected' : 'unavailable',
    features: ['appointments', 'admin-notes', 'planner-notifications', 'gem-media'],
    revision: process.env.RENDER_GIT_COMMIT || null
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl.split('?')[0]}` });
});

// Basic Test Route
app.get('/', (req, res) => {
  res.send('Pinnawala Gems API is running...');
});

async function startServer() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGO_URI and JWT_SECRET must be configured before starting the backend.');
  }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  const port = process.env.PORT || 5000;
  return app.listen(port, () => console.log(`Pinnawala Gems API listening on port ${port}`));
}

if (require.main === module) {
  startServer().catch(async (error) => {
    console.error(`Backend startup failed: ${error.name}. Check the server environment and database connection.`);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = app;
