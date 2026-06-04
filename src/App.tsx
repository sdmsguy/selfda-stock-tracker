import { useSession } from './store/useSession';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { stage } = useSession();

  if (stage === 'login' || stage === 'error') return <LoginPage />;
  
  if (stage === 'loading') return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-slate-900 font-black tracking-tight text-xl">Selfda</p>
        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mt-2">Securing Intelligence Session</p>
      </div>
    </div>
  );

  return <Dashboard />;
}
