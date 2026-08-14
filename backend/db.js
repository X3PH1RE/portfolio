import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'analytics.db');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseKey);
let supabase = null;
let sqliteDb = null;

if (isSupabaseEnabled) {
  console.log('⚡ Connected to Supabase Cloud Database:', supabaseUrl);
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.log('📁 Using local SQLite database at:', dbPath);
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening SQLite database:', err);
  });
}

// Helper SQLite Promise wrappers
const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initDb = async () => {
  if (isSupabaseEnabled) {
    console.log('Supabase mode active. Please ensure tables "sessions" and "clicks" exist (see backend/supabase_schema.sql).');
    return;
  }

  await queryRun(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      ip TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      country_code TEXT,
      org TEXT,
      isp TEXT,
      device_type TEXT,
      os TEXT,
      browser TEXT,
      screen_res TEXT,
      referrer TEXT,
      entry_page TEXT,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_seconds INTEGER DEFAULT 0
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      link_url TEXT,
      link_text TEXT,
      link_type TEXT,
      section TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES sessions(session_id)
    )
  `);

  console.log('SQLite database tables initialized.');
};

export const saveSession = async (sess) => {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('sessions').upsert({
      session_id: sess.sessionId,
      ip: sess.ip,
      city: sess.city,
      state: sess.state,
      country: sess.country,
      country_code: sess.countryCode,
      org: sess.org,
      isp: sess.isp,
      device_type: sess.device_type,
      os: sess.os,
      browser: sess.browser,
      screen_res: sess.screen_res,
      referrer: sess.referrer,
      entry_page: sess.entry_page,
      last_ping: new Date().toISOString()
    }, { onConflict: 'session_id' });
    if (error) console.error('Supabase session save error:', error.message);
  } else {
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
      sess.sessionId, sess.ip, sess.city, sess.state, sess.country, sess.countryCode,
      sess.org, sess.isp, sess.device_type, sess.os, sess.browser, sess.screen_res, sess.referrer, sess.entry_page
    ]);
  }
};

export const updateHeartbeat = async (sessionId, duration) => {
  const dur = parseInt(duration, 10) || 0;
  if (isSupabaseEnabled) {
    const { data: existing } = await supabase.from('sessions').select('duration_seconds').eq('session_id', sessionId).single();
    const newDur = Math.max(existing?.duration_seconds || 0, dur);
    const { error } = await supabase.from('sessions').update({
      last_ping: new Date().toISOString(),
      duration_seconds: newDur
    }).eq('session_id', sessionId);
    if (error) console.error('Supabase heartbeat error:', error.message);
  } else {
    await queryRun(
      `UPDATE sessions SET last_ping = CURRENT_TIMESTAMP, duration_seconds = MAX(duration_seconds, ?) WHERE session_id = ?`,
      [dur, sessionId]
    );
  }
};

export const saveClick = async (click) => {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from('clicks').insert({
      session_id: click.sessionId,
      link_url: click.linkUrl,
      link_text: click.linkText,
      link_type: click.linkType,
      section: click.section
    });
    if (error) console.error('Supabase click save error:', error.message);
  } else {
    await queryRun(
      `INSERT INTO clicks (session_id, link_url, link_text, link_type, section) VALUES (?, ?, ?, ?, ?)`,
      [click.sessionId, click.linkUrl, click.linkText, click.linkType, click.section]
    );
  }
};

export const getStats = async () => {
  if (isSupabaseEnabled) {
    const { data: sessions } = await supabase.from('sessions').select('*').order('start_time', { ascending: false });
    const { data: clicks } = await supabase.from('clicks').select('*').order('created_at', { ascending: true });

    const totalVisitors = sessions?.length || 0;
    const uniqueIPs = new Set(sessions?.map(s => s.ip)).size;
    const totalClicks = clicks?.length || 0;
    const totalDuration = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
    const avgDurationSeconds = totalVisitors > 0 ? Math.round(totalDuration / totalVisitors) : 0;

    // Top orgs
    const orgCounts = {};
    sessions?.forEach(s => {
      if (s.org && s.org !== 'Unknown Organization') {
        orgCounts[s.org] = (orgCounts[s.org] || 0) + 1;
      }
    });
    const topOrganizations = Object.entries(orgCounts)
      .map(([org, count]) => ({ org, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Location breakdown
    const locCounts = {};
    sessions?.forEach(s => {
      const key = `${s.country || 'Unknown'}|${s.state || ''}|${s.city || ''}`;
      locCounts[key] = (locCounts[key] || 0) + 1;
    });
    const locationBreakdown = Object.entries(locCounts)
      .map(([key, count]) => {
        const [country, state, city] = key.split('|');
        return { country, state, city, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    // Country breakdown
    const countryCounts = {};
    sessions?.forEach(s => {
      const key = `${s.country || 'Unknown'}|${s.country_code || 'XX'}`;
      countryCounts[key] = (countryCounts[key] || 0) + 1;
    });
    const countryBreakdown = Object.entries(countryCounts)
      .map(([key, count]) => {
        const [country, country_code] = key.split('|');
        return { country, country_code, count };
      })
      .sort((a, b) => b.count - a.count);

    // Device breakdown
    const devCounts = {};
    sessions?.forEach(s => {
      const d = s.device_type || 'Desktop';
      devCounts[d] = (devCounts[d] || 0) + 1;
    });
    const deviceBreakdown = Object.entries(devCounts).map(([device_type, count]) => ({ device_type, count }));

    // OS breakdown
    const osCounts = {};
    sessions?.forEach(s => {
      const o = s.os || 'Other';
      osCounts[o] = (osCounts[o] || 0) + 1;
    });
    const osBreakdown = Object.entries(osCounts).map(([os, count]) => ({ os, count }));

    // Browser breakdown
    const browserCounts = {};
    sessions?.forEach(s => {
      const b = s.browser || 'Other';
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    });
    const browserBreakdown = Object.entries(browserCounts).map(([browser, count]) => ({ browser, count }));

    // Top Links
    const linkCounts = {};
    clicks?.forEach(c => {
      const key = `${c.link_url}|${c.link_text || ''}|${c.link_type || ''}|${c.section || ''}`;
      linkCounts[key] = (linkCounts[key] || 0) + 1;
    });
    const topLinks = Object.entries(linkCounts)
      .map(([key, count]) => {
        const [link_url, link_text, link_type, section] = key.split('|');
        return { link_url, link_text, link_type, section, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Recent sessions with associated clicks
    const clickMap = {};
    clicks?.forEach(c => {
      if (!clickMap[c.session_id]) clickMap[c.session_id] = [];
      clickMap[c.session_id].push(c);
    });

    const recentSessions = (sessions || []).slice(0, 50).map(s => ({
      ...s,
      clicks: clickMap[s.session_id] || []
    }));

    return {
      summary: { totalVisitors, uniqueIPs, totalClicks, avgDurationSeconds },
      topOrganizations,
      locationBreakdown,
      countryBreakdown,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
      topLinks,
      recentSessions
    };
  }

  // SQLite fallback
  const totalVisitors = await queryGet(`SELECT COUNT(*) as count FROM sessions`);
  const uniqueIPs = await queryGet(`SELECT COUNT(DISTINCT ip) as count FROM sessions`);
  const totalClicks = await queryGet(`SELECT COUNT(*) as count FROM clicks`);
  const avgDuration = await queryGet(`SELECT AVG(duration_seconds) as avg FROM sessions`);

  const topOrganizations = await queryAll(`
    SELECT org, COUNT(*) as count FROM sessions 
    WHERE org IS NOT NULL AND org != '' AND org != 'Unknown Organization'
    GROUP BY org ORDER BY count DESC LIMIT 15
  `);

  const locationBreakdown = await queryAll(`
    SELECT country, state, city, COUNT(*) as count FROM sessions GROUP BY country, state, city ORDER BY count DESC LIMIT 25
  `);

  const countryBreakdown = await queryAll(`
    SELECT country, country_code, COUNT(*) as count FROM sessions GROUP BY country, country_code ORDER BY count DESC
  `);

  const deviceBreakdown = await queryAll(`SELECT device_type, COUNT(*) as count FROM sessions GROUP BY device_type`);
  const osBreakdown = await queryAll(`SELECT os, COUNT(*) as count FROM sessions GROUP BY os`);
  const browserBreakdown = await queryAll(`SELECT browser, COUNT(*) as count FROM sessions GROUP BY browser`);

  const topLinks = await queryAll(`
    SELECT link_url, link_text, link_type, section, COUNT(*) as count FROM clicks GROUP BY link_url, link_text ORDER BY count DESC LIMIT 20
  `);

  const recentSessionsRaw = await queryAll(`SELECT * FROM sessions ORDER BY start_time DESC LIMIT 50`);
  const recentSessions = await Promise.all(
    recentSessionsRaw.map(async (sess) => {
      const clicks = await queryAll(
        `SELECT link_url, link_text, link_type, section, created_at FROM clicks WHERE session_id = ? ORDER BY created_at ASC`,
        [sess.session_id]
      );
      return { ...sess, clicks };
    })
  );

  return {
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
  };
};

export default { saveSession, updateHeartbeat, saveClick, getStats, initDb };
