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
    <header className="fixed inset-x-0 top-0 z-[9999] border-b border-[#ECE7E1] bg-white/95 text-[#1F1F1F] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8B6F5B] text-sm text-white">
            <i className="fa-solid fa-chart-simple" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-[-0.02em] text-[#1F1F1F]">
              Sales Coach AI
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-[#9C948E]">
              Master Workspace
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#ECE7E1] bg-white px-3.5 text-sm font-semibold text-[#706A66] transition hover:bg-[#F7F2EE] disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4"
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
