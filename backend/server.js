import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { initDb, queryAll, queryGet, queryRun } from './db.js';
import { getIpInfo } from './geo.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ashwin_portfolio_data';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_analytics_jwt_key_2026';

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

// Initialize SQLite database
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

    const sql = `
      INSERT INTO sessions (
        session_id, ip, city, state, country, country_code, org, isp,
        device_type, os, browser, screen_res, referrer, entry_page, start_time, last_ping, duration_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
      ON CONFLICT(session_id) DO UPDATE SET
        last_ping = CURRENT_TIMESTAMP,
        screen_res = coalesce(excluded.screen_res, sessions.screen_res)
    `;

    await queryRun(sql, [
      sessionId,
      ipInfo.ip,
      ipInfo.city,
      ipInfo.state,
      ipInfo.country,
      ipInfo.countryCode,
      ipInfo.org,
      ipInfo.isp,
      device_type,
      os,
      browser,
      screenRes || 'Unknown',
      referrer || 'Direct',
      entryPage || '/'
    ]);

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

    const dur = parseInt(duration, 10) || 0;
    await queryRun(
      `UPDATE sessions SET last_ping = CURRENT_TIMESTAMP, duration_seconds = MAX(duration_seconds, ?) WHERE session_id = ?`,
      [dur, sessionId]
    );

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

    await queryRun(
      `INSERT INTO clicks (session_id, link_url, link_text, link_type, section) VALUES (?, ?, ?, ?, ?)`,
      [sessionId, linkUrl, linkText || 'Link', linkType || 'Outbound', section || 'Unknown']
    );

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
    const totalVisitors = await queryGet(`SELECT COUNT(*) as count FROM sessions`);
    const uniqueIPs = await queryGet(`SELECT COUNT(DISTINCT ip) as count FROM sessions`);
    const totalClicks = await queryGet(`SELECT COUNT(*) as count FROM clicks`);
    const avgDuration = await queryGet(`SELECT AVG(duration_seconds) as avg FROM sessions`);

    const topOrganizations = await queryAll(`
      SELECT org, COUNT(*) as count 
      FROM sessions 
      WHERE org IS NOT NULL AND org != '' AND org != 'Unknown Organization'
      GROUP BY org 
      ORDER BY count DESC 
      LIMIT 15
    `);

    const locationBreakdown = await queryAll(`
      SELECT country, state, city, COUNT(*) as count 
      FROM sessions 
      GROUP BY country, state, city 
      ORDER BY count DESC 
      LIMIT 25
    `);

    const countryBreakdown = await queryAll(`
      SELECT country, country_code, COUNT(*) as count 
      FROM sessions 
      GROUP BY country, country_code 
      ORDER BY count DESC
    `);

    const deviceBreakdown = await queryAll(`
      SELECT device_type, COUNT(*) as count FROM sessions GROUP BY device_type
    `);

    const osBreakdown = await queryAll(`
      SELECT os, COUNT(*) as count FROM sessions GROUP BY os
    `);

    const browserBreakdown = await queryAll(`
      SELECT browser, COUNT(*) as count FROM sessions GROUP BY browser
    `);

    const topLinks = await queryAll(`
      SELECT link_url, link_text, link_type, section, COUNT(*) as count 
      FROM clicks 
      GROUP BY link_url, link_text 
      ORDER BY count DESC 
      LIMIT 20
    `);

    const recentSessionsRaw = await queryAll(`
      SELECT 
        s.session_id, s.ip, s.city, s.state, s.country, s.org, s.isp,
        s.device_type, s.os, s.browser, s.screen_res, s.referrer,
        s.start_time, s.last_ping, s.duration_seconds
      FROM sessions s 
      ORDER BY s.start_time DESC 
      LIMIT 50
    `);

    // Fetch clicks for recent sessions
    const recentSessions = await Promise.all(
      recentSessionsRaw.map(async (sess) => {
        const clicks = await queryAll(
          `SELECT link_url, link_text, link_type, section, created_at FROM clicks WHERE session_id = ? ORDER BY created_at ASC`,
          [sess.session_id]
        );
        return { ...sess, clicks };
      })
    );

    res.json({
      summary: {
        totalVisitors: totalVisitors?.count || 0,
        uniqueIPs: uniqueIPs?.count || 0,
        totalClicks: totalClicks?.count || 0,
        avgDurationSeconds: Math.round(avgDuration?.avg || 0)
      },
      topOrganizations,
      locationBreakdown,
      countryBreakdown,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
      topLinks,
      recentSessions
    });
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
