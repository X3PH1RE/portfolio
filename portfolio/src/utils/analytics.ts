// Portfolio Analytics & Click Tracker SDK

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem('portfolio_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem('portfolio_session_id', id);
  }
  return id;
}

let startTime = Date.now();
let heartbeatTimer: any = null;

export function initAnalytics() {
  // Do not track if visiting the data dashboard page itself
  if (window.location.pathname.startsWith('/data')) return;

  const sessionId = getOrCreateSessionId();
  startTime = Date.now();

  const sessionData = {
    sessionId,
    userAgent: navigator.userAgent,
    screenRes: `${window.screen.width}x${window.screen.height}`,
    referrer: document.referrer || 'Direct',
    entryPage: window.location.pathname + window.location.hash
  };

  // Send initial session event
  fetch(`${API_BASE}/api/analytics/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  }).catch(() => {/* Silent fallback if backend unreachable */});

  // Start periodic heartbeat ping (every 10s)
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    sendHeartbeat(sessionId);
  }, 10000);

  // Send final beacon on page unload or hidden state
  const sendFinalBeacon = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const data = JSON.stringify({ sessionId, duration });
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE}/api/analytics/heartbeat`, blob);
    } else {
      fetch(`${API_BASE}/api/analytics/heartbeat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true
      }).catch(() => {});
    }
  };

  window.addEventListener('beforeunload', sendFinalBeacon);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendFinalBeacon();
    }
  });

  // Attach global click interceptor for link tracking
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a, button');
    if (!target) return;

    let href = target.getAttribute('href') || target.getAttribute('data-href') || '';
    let text = (target.textContent || '').trim().substring(0, 80);

    if (!href && target.tagName.toLowerCase() === 'button') {
      href = '#' + (target.getAttribute('id') || text);
    }

    if (!href) return;

    let linkType = 'Internal';
    if (href.startsWith('http') || href.startsWith('mailto:')) {
      linkType = 'Outbound';
    } else if (href.startsWith('#')) {
      linkType = 'Navigation';
    }

    const sectionEl = target.closest('section');
    const section = sectionEl ? sectionEl.id || 'Global' : 'Header/Footer';

    trackClick(href, text, linkType, section);
  }, true);
}

function sendHeartbeat(sessionId: string) {
  const duration = Math.floor((Date.now() - startTime) / 1000);
  fetch(`${API_BASE}/api/analytics/heartbeat`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, duration })
  }).catch(() => {});
}

export function trackClick(linkUrl: string, linkText?: string, linkType?: string, section?: string) {
  const sessionId = getOrCreateSessionId();
  fetch(`${API_BASE}/api/analytics/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      linkUrl,
      linkText: linkText || linkUrl,
      linkType: linkType || 'Outbound',
      section: section || 'Unknown'
    })
  }).catch(() => {});
}
