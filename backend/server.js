const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// 🔹 අලුතින් Cloudinary පැකේජ් ටික ගෙන්න ගත්තා
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // req.file.path කියන එක ඇතුළේ තියෙන්නේ කවදාවත් මැකෙන්නේ නැති Cloudinary ලින්ක් එක!
  const imageUrl = req.file.path;
  res.json({ imageUrl });
});

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

// Connect to MongoDB Database
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000, 
  family: 4 
}).then(() => {
  console.log("✅ MongoDB Connected Successfully");
}).catch((error) => {
  console.log("❌ MongoDB Connection Error: ", error);
});

// Basic Test Route
app.get('/', (req, res) => {
  res.send('Pinnawala Gems API is running...');
});

const jwt = require('jsonwebtoken');

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});