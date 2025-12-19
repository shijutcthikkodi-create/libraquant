import React, { useState, useMemo } from 'react';
import { Menu, X, BarChart2, Radio, ShieldAlert, LogOut, FileText, User as UserIcon, Scale, Clock } from 'lucide-react';
import { User } from '../types';
import { SEBI_DISCLAIMER } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const daysLeft = useMemo(() => {
    if (!user?.expiryDate) return 0;
    const end = new Date(user.expiryDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [user]);

  const NavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors ${
        currentPage === page
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className="mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden">
      {/* Dynamic Watermark */}
      {user && (
        <div className="watermark">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="watermark-text">
              {user.phoneNumber} <span className="text-sm opacity-50">{user.id}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-50 sticky top-0">
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Scale size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">LibraQuant</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-300">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:relative z-40 top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
      >
        <div className="p-6 hidden md:flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-900/20">
             <Scale size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">LibraQuant</h1>
            <p className="text-xs text-purple-400 font-mono">PRO TERMINAL</p>
          </div>
        </div>

        <nav className="flex-1 px-4">
          <NavItem page="dashboard" icon={Radio} label="Live Signals" />
          <NavItem page="stats" icon={BarChart2} label="P&L Analytics" />
          <NavItem page="rules" icon={ShieldAlert} label="Rules & Disclaimer" />
          {user?.isAdmin && <NavItem page="admin" icon={FileText} label="Admin Panel" />}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 mr-3">
              <UserIcon size={16} />
            </div>
            <div className="overflow-hidden w-full">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              
              {/* Expiry Countdown */}
              <div className={`mt-1 flex items-center space-x-1.5 text-xs font-mono font-bold ${
                  daysLeft <= 5 ? 'text-rose-500' : 'text-emerald-400'
              }`}>
                  <Clock size={10} />
                  <span>{daysLeft} Days Left</span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-red-900/20 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-950 relative z-10">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
            {children}
        </div>
        
        {/* Sticky Disclaimer */}
        <div className="bg-amber-900/20 border-t border-amber-900/30 p-2 text-[10px] text-amber-500/80 text-center font-mono fixed bottom-0 w-full md:w-[calc(100%-16rem)] right-0 backdrop-blur-sm z-50">
           {SEBI_DISCLAIMER.substring(0, 150)}...
        </div>
      </main>
    </div>
  );
};

export default Layout;