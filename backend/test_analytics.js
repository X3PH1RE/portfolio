import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000';

async function runTests() {
  console.log('--- STARTING ANALYTICS VERIFICATION TESTS ---');

  const sessionId = 'test_sess_' + Date.now();

  // 1. Session tracking
  console.log('1. Testing POST /api/analytics/session...');
  const sessRes = await fetch(`${API_BASE}/api/analytics/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '8.8.8.8' },
    body: JSON.stringify({
      sessionId,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      screenRes: '1920x1080',
      referrer: 'https://google.com',
      entryPage: '/'
    })
  });
  const sessData = await sessRes.json();
  console.log('Session response:', sessData);

  // 2. Heartbeat tracking
  console.log('2. Testing PUT /api/analytics/heartbeat...');
  const hbRes = await fetch(`${API_BASE}/api/analytics/heartbeat`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, duration: 45 })
  });
  console.log('Heartbeat response:', await hbRes.json());

  // 3. Click tracking
  console.log('3. Testing POST /api/analytics/click...');
  const clickRes = await fetch(`${API_BASE}/api/analytics/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      linkUrl: 'https://github.com/ashwinmenon',
      linkText: 'GitHub Profile',
      linkType: 'Outbound',
      section: 'Projects'
    })
  });
  console.log('Click response:', await clickRes.json());

  // 4. Admin Login
  console.log('4. Testing POST /api/admin/login...');
  const loginRes = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'ashwin_portfolio_data'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login response:', loginData);

  if (!loginData.token) {
    throw new Error('Login failed!');
  }

  // 5. Admin Stats
  console.log('5. Testing GET /api/admin/stats...');
  const statsRes = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  const statsData = await statsRes.json();
  console.log('Stats Summary:', statsData.summary);
  console.log('Top Organizations:', statsData.topOrganizations);
  console.log('Recent Sessions Count:', statsData.recentSessions?.length);

  console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
