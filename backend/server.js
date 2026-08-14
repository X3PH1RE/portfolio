import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { initDb, saveSession, updateHeartbeat, saveClick, getStats } from './db.js';
import { getIpInfo } from './geo.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ashwin_portfolio_data';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_analytics_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Initialize Database connection (Supabase or SQLite)
initDb().catch(console.error);

// User-Agent parser helper
function parseUserAgent(ua = '') {
  let device_type = 'Desktop';
  if (/mobile/i.test(ua)) device_type = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) device_type = 'Tablet';

  let os = 'Other';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Other';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';

  return { device_type, os, browser };
}

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Track Session / Pageview
app.post('/api/analytics/session', async (req, res) => {
  try {
    const { sessionId, userAgent, screenRes, referrer, entryPage } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
    const ipInfo = await getIpInfo(rawIp);
    const { device_type, os, browser } = parseUserAgent(userAgent);

    await saveSession({
      sessionId,
      ip: ipInfo.ip,
      city: ipInfo.city,
      state: ipInfo.state,
      country: ipInfo.country,
      countryCode: ipInfo.countryCode,
      org: ipInfo.org,
      isp: ipInfo.isp,
      device_type,
      os,
      browser,
      screen_res: screenRes || 'Unknown',
      referrer: referrer || 'Direct',
      entry_page: entryPage || '/'
    });

    res.json({
      success: true,
      sessionId,
      location: { city: ipInfo.city, state: ipInfo.state, country: ipInfo.country },
      org: ipInfo.org
    });
  } catch (err) {
    console.error('Session tracking error:', err);
    res.status(500).json({ error: 'Failed to record session' });
  }
});

// Heartbeat endpoint to update visit duration
app.put('/api/analytics/heartbeat', async (req, res) => {
  try {
    const { sessionId, duration } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    await updateHeartbeat(sessionId, duration);
    res.json({ success: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
});

// Track link click
app.post('/api/analytics/click', async (req, res) => {
  try {
    const { sessionId, linkUrl, linkText, linkType, section } = req.body;
    if (!sessionId || !linkUrl) {
      return res.status(400).json({ error: 'sessionId and linkUrl are required' });
    }

    await saveClick({
      sessionId,
      linkUrl,
      linkText: linkText || 'Link',
      linkType: linkType || 'Outbound',
      section: section || 'Unknown'
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Click tracking error:', err);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ success: true, token, username });
  }
  return res.status(401).json({ error: 'Invalid username or password' });
});

// Admin stats endpoint (protected)
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    const statsData = await getStats();
    res.json(statsData);
  } catch (err) {
    console.error('Stats endpoint error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Analytics backend listening on port ${PORT}`);
});
