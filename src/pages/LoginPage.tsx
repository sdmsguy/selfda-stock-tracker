import { useEffect, useState } from 'react';
import { useSession } from '../store/useSession';
import { getLoginURL } from '../lib/kiteApi';
import { Zap, Shield, Key, Globe, Copy, Check, ArrowRight, Info } from 'lucide-react';

export default function LoginPage() {
  const { stage, error, autoLogin } = useSession();
  
  const getInitial = (key: string, storageKey: string) => {
    const fromStorage = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (fromStorage) return fromStorage;
    
    try {
      const ghost = JSON.parse(window.name);
      return ghost[key] || '';
    } catch {
      return '';
    }
  };

  const [proxy, setProxy] = useState(() => getInitial('p', 'sp_proxy'));
  const [apiKey, setApiKey] = useState(() => getInitial('k', 'sp_last_key'));
  const [apiSecret, setApiSecret] = useState(() => getInitial('s', 'sp_last_secret'));
  const [copied, setCopied] = useState(false);

  const currentUrl = window.location.origin + window.location.pathname;
  const isReady = proxy.trim() && apiKey.trim() && apiSecret.trim();

  const saveCreds = (p: string, k: string, s: string) => {
    localStorage.setItem('sp_proxy', p);
    localStorage.setItem('sp_last_key', k);
    localStorage.setItem('sp_last_secret', s);
    sessionStorage.setItem('sp_proxy', p);
    sessionStorage.setItem('sp_last_key', k);
    sessionStorage.setItem('sp_last_secret', s);
    window.name = JSON.stringify({ p, k, s });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('request_token');
    const parkedToken = localStorage.getItem('sp_pending_req_token');
    const token = urlToken || parkedToken;

    if (!token || stage === 'loading' || stage === 'ready') return;

    if (isReady) {
      autoLogin(apiKey.trim(), apiSecret.trim(), token, proxy.trim());
      localStorage.removeItem('sp_pending_req_token');
      if (urlToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [isReady, stage, apiKey, apiSecret, proxy, autoLogin]);

  const handleStartLogin = () => {
    if (!isReady) return;
    saveCreds(proxy.trim(), apiKey.trim(), apiSecret.trim());
    window.location.href = getLoginURL(apiKey.trim());
  };

  const copyRedirect = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasToken = new URLSearchParams(window.location.search).has('request_token') || !!localStorage.getItem('sp_pending_req_token');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 mb-6 shadow-2xl shadow-indigo-200">
            <Zap size={36} className="text-white fill-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Selfda</h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-[10px]">Premium AI Trading Intelligence</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
          {hasToken && (
            <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${isReady ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100 animate-pulse'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className={`text-xs font-bold ${isReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isReady ? 'Ready to resume session' : 'Auth successful! Complete credentials.'}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-indigo-600" />
                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Redirect Configuration</p>
              </div>
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm">
                <code className="text-[11px] text-slate-500 truncate font-bold">{currentUrl}</code>
                <button onClick={copyRedirect} className="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-indigo-600">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-medium leading-relaxed">Set this as your "Redirect URL" in the Kite Developer Console.</p>
            </div>

            <div className="space-y-5">
              <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                  <Globe size={12} /> 1. CORS Proxy URL
                </label>
                <input 
                  type="url" 
                  value={proxy} 
                  onChange={e => { setProxy(e.target.value); saveCreds(e.target.value, apiKey, apiSecret); }} 
                  placeholder="https://your-proxy.workers.dev" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300" 
                />
              </div>
              
              <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                  <Key size={12} /> 2. Kite API Key
                </label>
                <input 
                  type="text" 
                  value={apiKey} 
                  onChange={e => { setApiKey(e.target.value); saveCreds(proxy, e.target.value, apiSecret); }} 
                  placeholder="Enter API Key" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300" 
                />
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                  <Shield size={12} /> 3. Kite API Secret
                </label>
                <input 
                  type="password" 
                  value={apiSecret} 
                  onChange={e => { setApiSecret(e.target.value); saveCreds(proxy, apiKey, e.target.value); }} 
                  placeholder="••••••••••••••••" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-slate-300" 
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4">
              <p className="text-xs text-rose-600 font-bold">{error}</p>
            </div>
          )}

          <button 
            onClick={handleStartLogin} 
            disabled={!isReady || stage === 'loading'} 
            className="w-full py-5 rounded-[1.5rem] bg-slate-900 hover:bg-indigo-600 disabled:opacity-20 text-white font-black transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 flex items-center justify-center gap-3 group active:scale-[0.98]"
          >
            {stage === 'loading' ? (
              <><span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</>
            ) : (
              <>Authorize with Kite <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>

          <div className="pt-4">
            <p className="text-[10px] text-slate-400 text-center font-bold leading-relaxed uppercase tracking-widest">
              Secure OAuth 2.0 Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
