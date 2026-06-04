// Kite Connect v3 — Browser Client
// All requests route through the user-provided CORS proxy.

let _apiKey = '';
let _accessToken = '';
let _proxy = '';

export function configure(apiKey: string, accessToken: string, proxy: string) {
  _apiKey = apiKey;
  _accessToken = accessToken;
  _proxy = proxy.replace(/\/+$/, '');
}

export function isConfigured() { return !!_apiKey && !!_accessToken && !!_proxy; }
export function clearCredentials() { _apiKey = ''; _accessToken = ''; _proxy = ''; }

async function kfetch<T>(method: string, path: string, params?: any): Promise<T> {
  if (!_proxy) throw new Error('Proxy URL not configured');

  let url = `${_proxy}${path}`;
  
  const headers: any = {
    'X-Kite-Version': '3',
    'Authorization': `token ${_apiKey}:${_accessToken}`
  };

  const opts: RequestInit = { method, headers };

  if (method === 'GET' && params) {
    const qs = new URLSearchParams(params).toString();
    url += (url.includes('?') ? '&' : '?') + qs;
  } else if (params) {
    opts.body = new URLSearchParams(params).toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  try {
    const res = await fetch(url, opts);
    const j = await res.json();
    if (j.status !== 'success') {
      const err: any = new Error(j.message || j.error_type || 'Kite API Error');
      err.status = res.status; // Capture HTTP status (e.g. 403)
      throw err;
    }
    return j.data as T;
  } catch (e: any) {
    if (e.message.includes('Failed to fetch')) {
      throw new Error('Proxy unreachable. Check your Proxy URL and ensure it handles CORS/SSL.');
    }
    throw e;
  }
}

// ── Types ────────────────────────────────────────
export interface Profile { user_id: string; user_name: string; email: string; broker: string; }
export interface Margins { equity: { available: { live_balance: number }; utilised: { debits: number } }; }
export interface Holding { tradingsymbol: string; exchange: string; instrument_token: number; average_price: number; last_price: number; quantity: number; pnl: number; day_change_percentage: number; }
export interface Position { tradingsymbol: string; exchange: string; instrument_token: number; quantity: number; last_price: number; pnl: number; product: string; }
export interface Order { order_id: string; tradingsymbol: string; transaction_type: string; status: string; quantity: number; average_price: number; order_timestamp: string; }
export interface Candle { date: string; open: number; high: number; low: number; close: number; volume: number; }

// ── Endpoints ────────────────────────────────────
export const getProfile = () => kfetch<Profile>('GET', '/user/profile');
export const getMargins = () => kfetch<Margins>('GET', '/user/margins');
export const getHoldings = () => kfetch<Holding[]>('GET', '/portfolio/holdings');
export const getPositions = () => kfetch<{net: Position[]}>('GET', '/portfolio/positions').then(d => d.net);
export const getOrders = () => kfetch<Order[]>('GET', '/orders');

export async function getHistorical(token: number, from: string, to: string): Promise<Candle[]> {
  const data: any = await kfetch('GET', `/instruments/historical/${token}/day`, { from, to });
  return (data.candles || []).map((c: any) => ({ date: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5] }));
}

export function getLoginURL(apiKey: string) {
  return `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`;
}

export async function exchangeToken(apiKey: string, apiSecret: string, reqToken: string, proxy: string) {
  const msg = apiKey + reqToken + apiSecret;
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  const checksum = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const res = await fetch(`${proxy.replace(/\/+$/, '')}/session/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Kite-Version': '3' },
    body: new URLSearchParams({ api_key: apiKey, request_token: reqToken, checksum })
  });
  const data = await res.json();
  if (data.status !== 'success') throw new Error(data.message || 'Token exchange failed');
  return data.data.access_token;
}
