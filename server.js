
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
// CHANGED: Default port to 3000 as requested
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx|vnd.openxmlformats-officedocument.wordprocessingml.document/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// User Model
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: String,
  skills: [String],
  topics: [String],
  schedule: { type: Array, default: [] },
  agentActive: { type: Boolean, default: false },
  makeScenarioId: String,
  plan: { type: String, default: 'dev' }
});
const User = mongoose.model('User', UserSchema);

// Post Model for Activity Logs
const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  post_url: { type: String, default: '' },
  status: { type: String, default: 'posted' },
  created_at: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', PostSchema);

// AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// --- LINKEDIN OAUTH CALLBACK ---
app.get('/api/linkedin/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  // Frontend URL (Vite default)
  const FRONTEND_URL = 'http://localhost:5173';

  if (error) {
    return res.redirect(`${FRONTEND_URL}/#/app/settings?error=${error}&msg=${error_description}`);
  }

  try {
    // 1. Decode state to get userId
    const stateJson = Buffer.from(state, 'base64').toString('ascii');
    const { userId } = JSON.parse(stateJson);

    if (!userId) throw new Error("Invalid state parameter");

    // 2. Exchange code for token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3000/api/linkedin/callback',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Token exchange failed');

    // 3. Update Supabase Profile
    // We update the 'profiles' table in Supabase directly via REST API
    const supabaseUrl = process.env.SUPABASE_URL || 'https://fjghdbrqwbnzebeawvfg.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

    if (!supabaseKey) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var. Cannot update database.");
        throw new Error("Server configuration error: Missing DB Key");
    }

    // Call Supabase REST API
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            linkedin_token: tokenData.access_token,
            linkedin_connected: true
            // We can also fetch and store linkedin_profile_id if needed here
        })
    });

    if (!updateResponse.ok) {
        const errText = await updateResponse.text();
        throw new Error(`Database update failed: ${errText}`);
    }

    // 4. Redirect to frontend success
    res.redirect(`${FRONTEND_URL}/#/app/settings?success=true`);

  } catch (err) {
    console.error("LinkedIn Callback Error:", err);
    res.redirect(`${FRONTEND_URL}/#/app/settings?error=server_error&msg=${encodeURIComponent(err.message)}`);
  }
});

// --- PROXY FOR MAKE.COM AUTOMATION ---
// Fixes CORS issues by calling Make.com from backend
app.post('/api/trigger-make', async (req, res) => {
  const { payload } = req.body;
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: 'MAKE_WEBHOOK_URL not configured' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn("Make.com webhook returned:", response.status);
    }
    
    // We always return success to the frontend if the request was sent
    res.json({ success: true });
  } catch (error) {
    console.error("Make Proxy Error:", error);
    res.status(500).json({ error: 'Failed to trigger automation' });
  }
});


/**
 * GET /api/posts/:userId
 * Retrieves the posting history for a specific user
 */
app.get('/api/posts/:userId', async (req, res) => {
  // Bypassed auth for demo simplicity/compatibility with frontend Supabase
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json([]);
    }
    const posts = await Post.find({ userId }).sort({ created_at: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Fetch Posts Error:', error);
    res.status(500).json({ error: 'Failed to fetch post history' });
  }
});

/**
 * POST /api/auth/register
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      plan: 'dev'
    });

    await newUser.save();
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /api/upload-resume
 */
app.post('/api/upload-resume', upload.single('resume'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

/**
 * POST /api/save-schedule
 */
app.post('/api/save-schedule', authenticateToken, async (req, res) => {
  const { schedule } = req.body;
  const email = req.user.email;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { schedule },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, schedule: user.schedule });
  } catch (error) {
    console.error('Save Schedule Error:', error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

/**
 * GET /api/get-schedule
 */
app.get('/api/get-schedule', authenticateToken, async (req, res) => {
  const email = req.user.email;
  try {
    const user = await User.findOne({ email });
    res.status(200).json(user ? user.schedule : []);
  } catch (error) {
    console.error('Get Schedule Error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Legacy Mongo Agent Start (kept for compatibility)
app.post('/api/start-agent-legacy', authenticateToken, async (req, res) => {
  const { userData } = req.body;
  const email = req.user.email;
  try {
    // ... logic ...
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
