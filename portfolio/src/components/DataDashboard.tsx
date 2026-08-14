import { useEffect, useState } from 'react';
import './DataDashboard.css';

interface Summary {
  totalVisitors: number;
  uniqueIPs: number;
  totalClicks: number;
  avgDurationSeconds: number;
}

interface Organization {
  org: string;
  count: number;
}

interface Location {
  country: string;
  state: string;
  city: string;
  count: number;
}

interface Country {
  country: string;
  country_code: string;
  count: number;
}

interface Device {
  device_type: string;
  count: number;
}

interface ItemCount {
  os?: string;
  browser?: string;
  count: number;
}

interface TopLink {
  link_url: string;
  link_text: string;
  link_type: string;
  section: string;
  count: number;
}

interface Click {
  link_url: string;
  link_text: string;
  link_type: string;
  section: string;
  created_at: string;
}

interface Session {
  session_id: string;
  ip: string;
  city: string;
  state: string;
  country: string;
  org: string;
  isp: string;
  device_type: string;
  os: string;
  browser: string;
  screen_res: string;
  referrer: string;
  start_time: string;
  last_ping: string;
  duration_seconds: number;
  clicks: Click[];
}

interface StatsResponse {
  summary: Summary;
  topOrganizations: Organization[];
  locationBreakdown: Location[];
  countryBreakdown: Country[];
  deviceBreakdown: Device[];
  osBreakdown: ItemCount[];
  browserBreakdown: ItemCount[];
  topLinks: TopLink[];
  recentSessions: Session[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function DataDashboard() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('analytics_admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'organizations' | 'location' | 'devices' | 'links'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch stats when token changes
  useEffect(() => {
    if (!token) return;
    fetchStats();
  }, [token]);

  // Auto refresh interval
  useEffect(() => {
    if (!token || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [token, autoRefresh]);

  const fetchStats = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('analytics_admin_token');
        setToken(null);
        setError('Session expired. Please log in again.');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching analytics');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Invalid credentials');
      }

      localStorage.setItem('analytics_admin_token', data.token);
      setToken(data.token);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('analytics_admin_token');
    setToken(null);
    setStats(null);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch (e) {
      return isoStr;
    }
  };

  // If unauthenticated, show login view
  if (!token) {
    return (
      <div className="dash-login-container">
        <div className="dash-login-card">
          <form onSubmit={handleLogin} className="dash-login-form">
            {loginError && <div className="dash-alert dash-alert-error">{loginError}</div>}

            <div className="dash-form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
              />
            </div>

            <div className="dash-form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
              />
            </div>

            <button type="submit" className="dash-btn dash-btn-primary" disabled={isLoggingIn}>
              {isLoggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="dash-login-footer">
            <a href="/" className="dash-back-link">← Back to portfolio</a>
            <p className="dash-quirky-quote">
              Cool cool cool cool cool... You are <strong>NOT</strong> supposed to be here! Go back to stalking me if you will.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const topOrgName = stats?.topOrganizations?.[0]?.org || 'N/A';

  // Filtered sessions search
  const filteredSessions = stats?.recentSessions?.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.ip?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q) ||
      s.country?.toLowerCase().includes(q) ||
      s.org?.toLowerCase().includes(q) ||
      s.device_type?.toLowerCase().includes(q) ||
      s.browser?.toLowerCase().includes(q) ||
      s.clicks?.some(c => c.link_text.toLowerCase().includes(q) || c.link_url.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="dash-wrapper">
      {/* Header Bar */}
      <header className="dash-header">
        <div className="dash-header-left">
          <a href="/" className="dash-header-brand">
            <span className="dash-live-dot"></span>
            <strong>ashwinmenon.me</strong>
            <span className="dash-badge">Analytics</span>
          </a>
        </div>

        <div className="dash-header-right">
          <label className="dash-toggle-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto Refresh</span>
          </label>

          <button onClick={() => fetchStats()} className="dash-btn dash-btn-outline" disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>

          <button onClick={handleLogout} className="dash-btn dash-btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="dash-content">
        {error && <div className="dash-alert dash-alert-error">{error}</div>}

        {/* KPI Overview Cards */}
        <section className="dash-kpi-grid">
          <div className="dash-kpi-card">
            <div className="dash-kpi-title">Total Visitors</div>
            <div className="dash-kpi-value">{stats?.summary?.totalVisitors ?? '-'}</div>
            <div className="dash-kpi-sub">Total recorded pageviews</div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-title">Unique Visitors (IPs)</div>
            <div className="dash-kpi-value">{stats?.summary?.uniqueIPs ?? '-'}</div>
            <div className="dash-kpi-sub">Distinct IP addresses</div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-title">Avg Session Duration</div>
            <div className="dash-kpi-value">{formatDuration(stats?.summary?.avgDurationSeconds || 0)}</div>
            <div className="dash-kpi-sub">Time spent on site</div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-title">Total Link Clicks</div>
            <div className="dash-kpi-value">{stats?.summary?.totalClicks ?? '-'}</div>
            <div className="dash-kpi-sub">Outbound & internal clicks</div>
          </div>

          <div className="dash-kpi-card highlight">
            <div className="dash-kpi-title">Top Visiting Organization</div>
            <div className="dash-kpi-value dash-kpi-text">{topOrgName}</div>
            <div className="dash-kpi-sub">Company / ISP viewer</div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="dash-tabs">
          <button
            className={`dash-tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            ⚡ Live Sessions ({stats?.recentSessions?.length || 0})
          </button>

          <button
            className={`dash-tab ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            🏢 Companies & Orgs ({stats?.topOrganizations?.length || 0})
          </button>

          <button
            className={`dash-tab ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
          >
            📍 Location Breakdown ({stats?.locationBreakdown?.length || 0})
          </button>

          <button
            className={`dash-tab ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            💻 Devices & Browsers
          </button>

          <button
            className={`dash-tab ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            🔗 Click Telemetry ({stats?.topLinks?.length || 0})
          </button>
        </div>

        {/* Tab 1: Live Sessions Log */}
        {activeTab === 'sessions' && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Recent Visitor Sessions</h3>
              <input
                type="text"
                placeholder="Search by IP, City, Company, Device, Click..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dash-search-input"
              />
            </div>

            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Company / ISP</th>
                    <th>Device & OS</th>
                    <th>Duration</th>
                    <th>Links Clicked</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="dash-empty">No visitor sessions recorded yet. Visit the portfolio to generate live telemetry!</td>
                    </tr>
                  ) : (
                    filteredSessions.map((s) => (
                      <tr key={s.session_id}>
                        <td className="dash-time-cell">{formatDate(s.start_time)}</td>
                        <td>
                          <div className="dash-loc">
                            <span className="dash-country-tag">{s.country || 'Unknown'}</span>
                            <span className="dash-city">{s.city ? `${s.city}, ${s.state}` : 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`dash-org-pill ${s.org?.includes('Dev') ? 'dev' : ''}`}>
                            {s.org || 'Unknown Organization'}
                          </span>
                        </td>
                        <td>
                          <div className="dash-device-info">
                            <span className="dash-badge-outline">{s.device_type}</span>
                            <span>{s.os} • {s.browser}</span>
                          </div>
                        </td>
                        <td>
                          <span className="dash-duration-pill">{formatDuration(s.duration_seconds)}</span>
                        </td>
                        <td>
                          {s.clicks && s.clicks.length > 0 ? (
                            <div className="dash-clicks-list">
                              {s.clicks.map((c, idx) => (
                                <a
                                  key={idx}
                                  href={c.link_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="dash-click-tag"
                                  title={`${c.link_url} (${c.link_type})`}
                                >
                                  🔗 {c.link_text || c.link_url}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="dash-text-muted">No clicks</span>
                          )}
                        </td>
                        <td><code className="dash-ip">{s.ip}</code></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Companies & Organizations */}
        {activeTab === 'organizations' && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Organizations & Companies Viewing Portfolio</h3>
              <p className="dash-card-desc">Identified from visitor network ASN / ISP headers</p>
            </div>

            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Organization / Company Name</th>
                    <th>Visitor Count</th>
                    <th>Traffic Share</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topOrganizations?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="dash-empty">No corporate viewer data yet.</td>
                    </tr>
                  ) : (
                    stats?.topOrganizations?.map((org, i) => {
                      const percent = Math.round((org.count / (stats?.summary?.totalVisitors || 1)) * 100);
                      return (
                        <tr key={i}>
                          <td>
                            <strong className="dash-org-name">{org.org}</strong>
                          </td>
                          <td>
                            <span className="dash-count-badge">{org.count} visitors</span>
                          </td>
                          <td>
                            <div className="dash-progress-bar">
                              <div className="dash-progress-fill" style={{ width: `${Math.max(percent, 5)}%` }}></div>
                              <span className="dash-progress-text">{percent}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Geolocation */}
        {activeTab === 'location' && (
          <div className="dash-grid-2">
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Country Distribution</h3>
              </div>
              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.countryBreakdown?.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{c.country}</strong> ({c.country_code})
                        </td>
                        <td>{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <h3>City & State Breakdown</h3>
              </div>
              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Country</th>
                      <th>Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.locationBreakdown?.map((l, i) => (
                      <tr key={i}>
                        <td>{l.city}, {l.state}</td>
                        <td>{l.country}</td>
                        <td>{l.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Devices & Browsers */}
        {activeTab === 'devices' && (
          <div className="dash-grid-3">
            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Device Type</h3>
              </div>
              <div className="dash-stat-list">
                {stats?.deviceBreakdown?.map((d, i) => (
                  <div key={i} className="dash-stat-item">
                    <span>{d.device_type === 'Desktop' ? '🖥️ Desktop' : d.device_type === 'Mobile' ? '📱 Mobile' : '平板 Tablet'}</span>
                    <strong>{d.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Operating System</h3>
              </div>
              <div className="dash-stat-list">
                {stats?.osBreakdown?.map((o, i) => (
                  <div key={i} className="dash-stat-item">
                    <span>{o.os}</span>
                    <strong>{o.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <h3>Browser</h3>
              </div>
              <div className="dash-stat-list">
                {stats?.browserBreakdown?.map((b, i) => (
                  <div key={i} className="dash-stat-item">
                    <span>{b.browser}</span>
                    <strong>{b.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Link Click Telemetry */}
        {activeTab === 'links' && (
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>Clicked Links History</h3>
            </div>
            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Link Label</th>
                    <th>URL</th>
                    <th>Type</th>
                    <th>Section</th>
                    <th>Click Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topLinks?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="dash-empty">No link clicks recorded yet.</td>
                    </tr>
                  ) : (
                    stats?.topLinks?.map((l, i) => (
                      <tr key={i}>
                        <td><strong>{l.link_text}</strong></td>
                        <td>
                          <a href={l.link_url} target="_blank" rel="noreferrer" className="dash-link-url">
                            {l.link_url}
                          </a>
                        </td>
                        <td><span className="dash-badge-outline">{l.link_type}</span></td>
                        <td>{l.section}</td>
                        <td><strong className="dash-click-count">{l.count} clicks</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
