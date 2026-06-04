import { create } from 'zustand';
import * as K from '../lib/kiteApi';

interface Session {
  stage: 'login'|'loading'|'ready'|'error';
  error: string;
  profile: K.Profile | null;
  margins: K.Margins | null;
  holdings: K.Holding[];
  positions: K.Position[];
  orders: K.Order[];
  login: (key: string, token: string, proxy: string) => Promise<void>;
  autoLogin: (key: string, secret: string, reqToken: string, proxy: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const KEY = 'sp_creds_v4';
const TEMP_KEY = 'sp_temp_auth';

function saved() { try { const r = localStorage.getItem(KEY); if (!r) return null; const p = JSON.parse(r); return (p.k && p.t && p.p) ? p : null; } catch { return null; } }

export const useSession = create<Session>((set, get) => ({
  stage: 'login', error: '', profile: null, margins: null, holdings: [], positions: [], orders: [],

  autoLogin: async (key, secret, reqToken, proxy) => {
    set({ stage: 'loading', error: '' });
    try {
      const token = await K.exchangeToken(key, secret, reqToken, proxy);
      await get().login(key, token, proxy);
    } catch (e: any) {
      set({ stage: 'error', error: 'Token exchange failed: ' + e.message });
    }
  },

  login: async (key, token, proxy) => {
    set({ stage: 'loading', error: '' });
    K.configure(key, token, proxy);
    try {
      const profile = await K.getProfile();
      localStorage.setItem(KEY, JSON.stringify({ k: key, t: token, p: proxy }));
      localStorage.removeItem(TEMP_KEY); // Clear temp redirect data
      const [margins, holdings, positions, orders] = await Promise.all([
        K.getMargins().catch(() => null),
        K.getHoldings().catch(() => [] as K.Holding[]),
        K.getPositions().catch(() => [] as K.Position[]),
        K.getOrders().catch(() => [] as K.Order[]),
      ]);
      set({ stage: 'ready', profile, margins, holdings, positions, orders });
    } catch (e: any) {
      K.clearCredentials(); localStorage.removeItem(KEY);
      set({ stage: 'error', error: e?.message || 'Connection failed' });
    }
  },

  logout: () => { 
    localStorage.removeItem(KEY); 
    set({ stage: 'login', error: '', profile: null, margins: null, holdings: [], positions: [], orders: [] }); 
  },

  refresh: async () => {
    if (!K.isConfigured()) return;
    try {
      const [margins, holdings, positions, orders] = await Promise.all([
        K.getMargins().catch(() => get().margins),
        K.getHoldings().catch(() => get().holdings),
        K.getPositions().catch(() => get().positions),
        K.getOrders().catch(() => get().orders),
      ]);
      set({ margins, holdings, positions, orders });
    } catch {}
  },
}));

const s = saved();
if (s) useSession.getState().login(s.k, s.t, s.p);
