import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabase } from './services/supabaseClient';
import './index.css';

function MasterWorkspaceBar() {
  const [isMaster, setIsMaster] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    let active = true;

    const syncMasterSession = async () => {
      const { data: sessionData } = await client.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        if (active) setIsMaster(false);
        return;
      }

      const { data: userData, error } = await client
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!active) return;
      setIsMaster(!error && userData?.role === 'master');
    };

    void syncMasterSession();

    const { data: authListener } = client.auth.onAuthStateChange(() => {
      void syncMasterSession();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    root.style.paddingTop = isMaster ? '64px' : '';

    return () => {
      root.style.paddingTop = '';
    };
  }, [isMaster]);

  const handleLogout = async () => {
    if (!supabase || loggingOut) return;

    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Master logout failed:', error);
      setLoggingOut(false);
    }
  };

  if (!isMaster) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] border-b border-white/10 bg-slate-950/95 text-slate-100 shadow-[0_8px_24px_rgba(2,6,23,0.22)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm text-slate-100">
            <i className="fa-solid fa-chart-simple" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-white">
              Sales Coach AI
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Master Workspace</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
        >
          <i className={`fa-solid ${loggingOut ? 'fa-spinner fa-spin' : 'fa-right-from-bracket'} text-xs`} />
          <span>{loggingOut ? '로그아웃 중' : '로그아웃'}</span>
        </button>
      </div>
    </header>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <MasterWorkspaceBar />
    <App />
  </React.StrictMode>
);
