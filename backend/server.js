const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
// Image Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ෆොටෝස් සේව් වෙන ෆෝල්ඩර් එක
  },
  filename: (req, file, cb) => {
    // ෆොටෝ එකේ නමට වෙලාව එකතු කරනවා (එකම නම තියෙන ෆොටෝස් replace නොවෙන්න)
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage });

// Image Upload API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Upload වුණාට පස්සේ ඒකේ ලින්ක් එක Frontend එකට යවනවා
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

const gemRoutes = require('./routes/gemRoutes'); //   import Routes file
app.use('/api/gems', gemRoutes); // '/api/gems' kiyana link eken awoth ara routes walata yawanawa

// Server.js eke api/gems eka thiyena thana yatin meka danna
const workshopRoutes = require('./routes/workshopRoutes');
app.use('/api/workshop', workshopRoutes);

// server.js එකේ workshop එක යටින් මේක දාන්න
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

// මේක අනිත් route දාලා තියෙන තැනින්ම දාන්න
const stockRoutes = require('./routes/stockRoutes');
app.use('/api/stock', stockRoutes);

// Connect to MongoDB Database
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000, // Timeout eka poddak wadi karamu
  family: 4 // Meken thama aniwarenma IPv4 pavichchi karanna kiyanne
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

  // .env eke thiyena details ekka check karanawa
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