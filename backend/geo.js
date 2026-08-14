import http from 'http';

const geoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const isPrivateIp = (ip) => {
  if (!ip) return true;
  const cleanIp = ip.replace(/^::ffff:/, '');
  return (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)
  );
};

export const getIpInfo = async (rawIp) => {
  if (!rawIp) {
    return {
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
      countryCode: 'XX',
      org: 'Unknown Organization',
      isp: 'Unknown ISP',
      ip: '0.0.0.0'
    };
  }

  const ip = rawIp.replace(/^::ffff:/, '').split(',')[0].trim();

  if (isPrivateIp(ip)) {
    return {
      city: 'Kochi (Dev)',
      state: 'Kerala',
      country: 'India',
      countryCode: 'IN',
      org: 'Local Development Environment',
      isp: 'Dev Loopback',
      ip: ip
    };
  }

  // Check cache
  if (geoCache.has(ip)) {
    const cached = geoCache.get(ip);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,isp,org,as,query`;
    const data = await new Promise((resolve, reject) => {
      const req = http.get(url, { timeout: 3000 }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('IP lookup timed out'));
      });
    });

    if (data && data.status === 'success') {
      const result = {
        city: data.city || 'Unknown City',
        state: data.regionName || 'Unknown State',
        country: data.country || 'Unknown Country',
        countryCode: data.countryCode || 'XX',
        org: data.org || data.isp || 'Unknown Organization',
        isp: data.isp || 'Unknown ISP',
        ip: ip
      };

      geoCache.set(ip, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn(`Geo IP lookup failed for ${ip}:`, err.message);
  }

  // Fallback if API call fails
  return {
    city: 'Unknown City',
    state: 'Unknown State',
    country: 'Unknown Country',
    countryCode: 'XX',
    org: 'Unknown Organization',
    isp: 'Unknown ISP',
    ip: ip
  };
};
