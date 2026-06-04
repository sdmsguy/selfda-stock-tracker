import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from '../store/useSession';
import * as K from '../lib/kiteApi';
import { analyze } from '../lib/strategy';
import { generateSimulatedHistory } from '../lib/simulator';
import type { Analysis } from '../lib/strategy';
import {
  AreaChart, Area, Tooltip, XAxis, YAxis,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, ReferenceLine
} from 'recharts';
import { 
  Search, TrendingUp, Wallet, BarChart3, 
  Settings, LogOut, RefreshCw, Plus, 
  ChevronRight, Zap, Shield, Target,
  ArrowUpRight, ArrowDownRight, Activity,
  BrainCircuit, Globe, Cpu, Sparkles,
  LayoutDashboard, Briefcase, LineChart as ChartIcon,
  User, Bell, Menu, X, CreditCard, 
  ArrowRight, Info, CheckCircle2
} from 'lucide-react';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#64748B'];

type Tab = 'overview' | 'holdings' | 'market' | 'analysis';

export default function Dashboard() {
  const { profile, margins, holdings, orders, logout, refresh } = useSession();
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [selectedSym, setSelectedSym] = useState<string | null>(null);
  const [candles, setCandles] = useState<K.Candle[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [avgPrice, setAvgPrice] = useState<number | null>(null);

  // Auto-refresh
  useEffect(() => {
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const totalVal = holdings.reduce((s, h) => s + h.last_price * h.quantity, 0);
  const totalInv = holdings.reduce((s, h) => s + h.average_price * h.quantity, 0);
  const totalPnl = holdings.reduce((s, h) => s + h.pnl, 0);
  const totalPct = totalInv > 0 ? (totalPnl / totalInv) * 100 : 0;

  const pieData = useMemo(() => 
    holdings.map(h => ({ name: h.tradingsymbol, value: +(h.last_price * h.quantity).toFixed(0) })), 
    [holdings]
  );

  const runAI = useCallback(async (symbol: string, token?: number, ltp?: number, avg?: number) => {
    setSelectedSym(symbol);
    setAvgPrice(avg || null);
    setLoading(true);
    setAnalysis(null);
    setTab('analysis');
    setIsMenuOpen(false);
    
    try {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - 365);
      const fmt = (d: Date) => d.toISOString().split('T')[0] + ' 00:00:00';
      
      let c: K.Candle[];
      if (token) {
        try {
          c = await K.getHistorical(token, fmt(from), fmt(now));
        } catch (err: any) {
          c = generateSimulatedHistory(ltp || 1000);
        }
      } else {
        c = generateSimulatedHistory(ltp || 1000);
      }
      
      setCandles(c);
      setAnalysis(analyze(c, ltp || c[c.length-1].close));
    } catch (e: any) {
      setAnalysis({ 
        overall: 'HOLD', confidence: 0, strategies: [], 
        target: 0, stopLoss: 0, riskReward: 0, 
        summary: `Analysis failed: ${e?.message}` 
      });
    }
    setLoading(false);
  }, []);

  const chartData = useMemo(() => 
    candles.map(c => ({ 
      d: new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), 
      p: c.close 
    })), 
    [candles]
  );

  const marketMovers = holdings.length > 0 ? holdings.slice(0, 6) : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-indigo-100">
      {/* Premium Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-100 rounded-xl md:hidden transition-colors">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap size={22} className="text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Selfda</h1>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-slate-100 rounded-2xl px-5 py-2.5 w-[450px] border border-transparent focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-sm transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search stocks, portfolio, insights..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full ml-3 placeholder-slate-400 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2.5 hover:bg-slate-100 rounded-xl relative transition-colors">
            <Bell size={20} className="text-slate-500" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-1" />
          <div className="flex items-center gap-4 pl-2">
            <div className="hidden lg:block text-right">
              <div className="text-sm font-bold text-slate-900">{profile?.user_name}</div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{profile?.user_id}</div>
            </div>
            <button onClick={logout} className="w-11 h-11 rounded-xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-bold hover:bg-indigo-100 transition-all shadow-sm">
              {profile?.user_name?.slice(0, 1)}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className={`
          fixed inset-y-0 left-0 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 transition-transform duration-300 ease-out
          w-72 bg-white border-r border-slate-200 z-40 pt-24 md:pt-10 px-6 flex flex-col h-screen
        `}>
          <div className="space-y-2">
            <NavTab active={tab === 'overview'} onClick={() => {setTab('overview'); setIsMenuOpen(false);}} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
            <NavTab active={tab === 'holdings'} onClick={() => {setTab('holdings'); setIsMenuOpen(false);}} icon={<Briefcase size={20}/>} label="Portfolio" />
            <NavTab active={tab === 'market'} onClick={() => {setTab('market'); setIsMenuOpen(false);}} icon={<Globe size={20}/>} label="Market Pulse" />
            <NavTab active={tab === 'analysis'} onClick={() => {setTab('analysis'); setIsMenuOpen(false);}} icon={<BrainCircuit size={20}/>} label="AI Insights" />
          </div>

          <div className="mt-auto pb-10 space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Buying Power</span>
              </div>
              <div className="text-xl font-bold">₹{(margins?.equity.available.live_balance || 0).toLocaleString('en-IN')}</div>
              <button className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-colors">Add Funds</button>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-semibold hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {tab === 'overview' && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hello, {profile?.user_name?.split(' ')[0]} 👋</h2>
                    <p className="text-slate-500 font-medium mt-1">Your portfolio is looking healthy today.</p>
                  </div>
                  <button 
                    onClick={async () => { setBusy(true); await refresh(); setBusy(false); }}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-95"
                  >
                    <RefreshCw size={18} className={`${busy ? 'animate-spin' : ''} text-indigo-600`} />
                    Sync Data
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <PremiumCard className="lg:col-span-2 p-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-40 -mt-40 blur-[100px]" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2 opacity-80">
                        <Wallet size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Total Portfolio Value</span>
                      </div>
                      <h3 className="text-6xl font-black tracking-tighter mb-8">₹{totalVal.toLocaleString('en-IN')}</h3>
                      <div className="flex flex-wrap items-center gap-6">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black ${totalPnl >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {totalPnl >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          ₹{Math.abs(totalPnl).toLocaleString('en-IN')} ({totalPct.toFixed(2)}%)
                        </div>
                        <div className="h-10 w-[1px] bg-white/10" />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Invested</div>
                          <div className="text-lg font-bold">₹{totalInv.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30 pointer-events-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[{v:30},{v:45},{v:35},{v:60},{v:55},{v:80},{v:75}]}>
                          <Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={3} fill="rgba(255,255,255,0.2)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </PremiumCard>

                  <PremiumCard className="p-8 flex flex-col bg-white">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Asset Allocation</h4>
                      <Info size={16} className="text-slate-300" />
                    </div>
                    <div className="flex-1 flex items-center justify-center relative">
                      <div className="absolute text-center">
                        <div className="text-4xl font-black text-slate-900">{holdings.length}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assets</div>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={pieData} innerRadius={80} outerRadius={105} paddingAngle={6} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </PremiumCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PremiumCard className="p-8 bg-white">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" />
                        Top Performers
                      </h4>
                      <button onClick={() => setTab('holdings')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        View All <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {holdings.sort((a, b) => b.pnl - a.pnl).slice(0, 4).map(h => (
                        <div key={h.tradingsymbol} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group" onClick={() => runAI(h.tradingsymbol, h.instrument_token, h.last_price, h.average_price)}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:scale-110 transition-transform">
                              {h.tradingsymbol.slice(0, 1)}
                            </div>
                            <div>
                              <div className="text-base font-bold text-slate-900">{h.tradingsymbol}</div>
                              <div className="text-xs text-slate-500 font-medium">{h.quantity} Shares</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-base font-black ${h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toFixed(0)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-bold">LTP: ₹{h.last_price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PremiumCard>

                  <PremiumCard className="p-8 bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6">
                      <Sparkles size={32} className="text-indigo-100" />
                    </div>
                    <div className="flex items-center gap-2 mb-8">
                      <BrainCircuit size={20} className="text-indigo-600" />
                      <h4 className="text-sm font-black text-slate-900">Selfda AI Strategy</h4>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                        <p className="text-sm leading-relaxed font-medium">
                          "Your portfolio is currently <span className="font-black underline decoration-indigo-300 underline-offset-4">Growth-Optimized</span>. 
                          We suggest increasing exposure to Large-cap stability to hedge against mid-cap volatility."
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Risk Profile</div>
                          <div className="text-base font-black text-slate-900">Moderate</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Efficiency</div>
                          <div className="text-base font-black text-slate-900">84%</div>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                        Optimize Portfolio <ArrowRight size={16} />
                      </button>
                    </div>
                  </PremiumCard>
                </div>

                {marketMovers.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Portfolio Movers</h4>
                      <div className="h-[1px] flex-1 bg-slate-200 mx-6" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      {marketMovers.map(h => (
                        <button key={h.tradingsymbol} onClick={() => runAI(h.tradingsymbol, h.instrument_token, h.last_price, h.average_price)} className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group">
                          <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{h.tradingsymbol}</div>
                          <div className="text-xl font-black mt-2">₹{h.last_price.toFixed(1)}</div>
                          <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {h.pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {((h.pnl / (h.average_price * h.quantity)) * 100).toFixed(1)}%
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'holdings' && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portfolio Holdings</h2>
                    <p className="text-slate-500 font-medium mt-1">Manage and track your individual assets.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-8 py-4 rounded-3xl bg-white border border-slate-200 text-center shadow-sm">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Invested</div>
                      <div className="text-xl font-black text-slate-900">₹{totalInv.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="px-8 py-4 rounded-3xl bg-indigo-600 text-white text-center shadow-xl shadow-indigo-100">
                      <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mb-1">Current</div>
                      <div className="text-xl font-black">₹{totalVal.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                <PremiumCard className="overflow-hidden bg-white border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="p-8">Instrument</th>
                          <th className="p-8">Quantity</th>
                          <th className="p-8">Avg. Price</th>
                          <th className="p-8">LTP</th>
                          <th className="p-8">P&L</th>
                          <th className="p-8 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {holdings.map(h => (
                          <tr key={h.tradingsymbol} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-8">
                              <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">{h.tradingsymbol}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{h.exchange}</div>
                            </td>
                            <td className="p-8 text-sm font-bold text-slate-700">{h.quantity}</td>
                            <td className="p-8 text-sm font-bold text-slate-700">₹{h.average_price.toFixed(2)}</td>
                            <td className="p-8 text-sm font-black text-slate-900">₹{h.last_price.toFixed(2)}</td>
                            <td className="p-8">
                              <div className={`text-base font-black ${h.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toFixed(0)}
                              </div>
                              <div className="text-[11px] font-bold text-slate-400">
                                {((h.pnl / (h.average_price * h.quantity)) * 100).toFixed(2)}%
                              </div>
                            </td>
                            <td className="p-8 text-right">
                              <button 
                                onClick={() => runAI(h.tradingsymbol, h.instrument_token, h.last_price, h.average_price)}
                                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 transition-all shadow-sm"
                              >
                                AI Analyze
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </PremiumCard>
              </div>
            )}

            {tab === 'market' && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Market Pulse</h2>
                    <p className="text-slate-500 font-medium mt-1">Real-time global market intelligence.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Global Sentiment</div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-emerald-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600" style={{ width: '72%' }} />
                      </div>
                      <span className="text-xs font-black text-emerald-700">BULLISH</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <IndexCard label="NIFTY 50" value="22,453.10" change="+0.85%" up />
                  <IndexCard label="SENSEX" value="73,917.20" change="+0.78%" up />
                  <IndexCard label="NASDAQ" value="16,274.90" change="-0.42%" up={false} />
                  <IndexCard label="BANK NIFTY" value="47,580.45" change="+1.12%" up />
                </div>

                <PremiumCard className="p-10 bg-white">
                  <div className="flex items-center justify-between mb-10">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Market Performance Trends</h4>
                    <div className="flex gap-2">
                      {['1D', '1W', '1M', '1Y'].map(p => (
                        <button key={p} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${p === '1M' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{d:'Mon',v:4000},{d:'Tue',v:3000},{d:'Wed',v:2000},{d:'Thu',v:2780},{d:'Fri',v:1890}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8', fontWeight: 600}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8', fontWeight: 600}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        />
                        <Line type="monotone" dataKey="v" stroke="#6366F1" strokeWidth={4} dot={{ r: 6, fill: '#6366F1', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </PremiumCard>
              </div>
            )}

            {tab === 'analysis' && (
              <div className="space-y-8">
                {!selectedSym ? (
                  <div className="text-center py-40 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                    <div className="w-28 h-28 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <BrainCircuit size={56} className="text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3">Select an asset to analyze</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto">Choose a stock from your portfolio to run deep AI historical analysis and get strategic insights.</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-40 bg-white rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="relative w-28 h-28 mx-auto">
                      <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={40} className="text-indigo-600 animate-pulse fill-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900">Analyzing {selectedSym}</h2>
                      <p className="text-xs text-indigo-600 font-black uppercase tracking-[0.2em] mt-3">Processing Market Intelligence...</p>
                    </div>
                  </div>
                ) : analysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <PremiumCard className="p-10 bg-white">
                        <div className="flex items-center justify-between mb-10">
                          <div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{selectedSym}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">1-Year Performance Analysis</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-slate-900">₹{candles[candles.length-1]?.close.toFixed(2)}</div>
                            <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">Current Price</div>
                          </div>
                        </div>
                        <div className="h-[500px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis dataKey="d" hide />
                              <YAxis domain={['auto', 'auto']} hide />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                              />
                              {avgPrice && (
                                <ReferenceLine y={avgPrice} stroke="#F43F5E" strokeDasharray="6 6" strokeWidth={2} label={{ position: 'right', value: 'Avg Buy', fill: '#F43F5E', fontSize: 11, fontWeight: 900 }} />
                              )}
                              <Area type="monotone" dataKey="p" stroke="#6366F1" strokeWidth={5} fillOpacity={1} fill="url(#colorPrice)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </PremiumCard>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AnalysisStat label="Target Price" value={`₹${analysis.target}`} icon={<Target size={24} className="text-indigo-600" />} />
                        <AnalysisStat label="Stop Loss" value={`₹${analysis.stopLoss}`} icon={<Shield size={24} className="text-rose-600" />} />
                        <AnalysisStat label="Risk/Reward" value={analysis.riskReward.toString()} icon={<Activity size={24} className="text-slate-900" />} />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <PremiumCard className={`p-10 border-t-[12px] bg-white ${analysis.overall === 'BUY' ? 'border-t-emerald-500' : analysis.overall === 'SELL' ? 'border-t-rose-500' : 'border-t-amber-500'}`}>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">AI Recommendation</div>
                        <div className={`text-7xl font-black mb-6 ${analysis.overall === 'BUY' ? 'text-emerald-600' : analysis.overall === 'SELL' ? 'text-rose-600' : 'text-amber-600'}`}>
                          {analysis.overall}
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${analysis.confidence}%` }} />
                          </div>
                          <span className="text-sm font-black text-slate-900">{analysis.confidence}%</span>
                        </div>
                        <p className="text-base text-slate-600 leading-relaxed mb-10 font-medium">
                          {analysis.summary}
                        </p>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Signals</p>
                          {analysis.strategies.map(s => (
                            <div key={s.name} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-900">
                              <div className={`w-3 h-3 rounded-full shadow-sm ${s.signal === 'BUY' ? 'bg-emerald-500' : s.signal === 'SELL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              {s.name}: <span className={s.signal === 'BUY' ? 'text-emerald-600' : s.signal === 'SELL' ? 'text-rose-600' : 'text-amber-600'}>{s.signal}</span>
                            </div>
                          ))}
                        </div>
                      </PremiumCard>

                      <PremiumCard className="p-8 bg-white">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Historical Context</h4>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-500">52W High</span>
                            <span className="text-sm font-black text-slate-900">₹{(Math.max(...candles.map(c => c.high))).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-500">52W Low</span>
                            <span className="text-sm font-black text-slate-900">₹{(Math.min(...candles.map(c => c.low))).toFixed(2)}</span>
                          </div>
                          {avgPrice && (
                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                              <span className="text-sm font-bold text-slate-500">Growth Since Buy</span>
                              <span className={`text-sm font-black flex items-center gap-1 ${candles[candles.length-1].close >= avgPrice ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {candles[candles.length-1].close >= avgPrice ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                {(((candles[candles.length-1].close - avgPrice) / avgPrice) * 100).toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </PremiumCard>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; border: 2px solid transparent; background-clip: content-box; }
      `}} />
    </div>
  );
}

function NavTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative group
        ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' : 'text-slate-500 hover:bg-slate-50 font-semibold'}
      `}
    >
      <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'}`}>{icon}</span>
      <span className="text-sm tracking-tight">{label}</span>
      {active && <div className="absolute right-5 w-2 h-2 bg-white rounded-full shadow-sm" />}
    </button>
  );
}

function PremiumCard({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`rounded-[2.5rem] shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 ${className}`}
    >
      {children}
    </div>
  );
}

function IndexCard({ label, value, change, up }: { label: string, value: string, change: string, up: boolean }) {
  return (
    <PremiumCard className="p-8 bg-white">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</div>
      <div className="text-2xl font-black text-slate-900 mb-2">{value}</div>
      <div className={`text-xs font-black flex items-center gap-1.5 ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
        <div className={`p-1 rounded-lg ${up ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
        {change}
      </div>
    </PremiumCard>
  );
}

function AnalysisStat({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <PremiumCard className="p-8 flex items-center gap-6 bg-white">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
      </div>
    </PremiumCard>
  );
}
