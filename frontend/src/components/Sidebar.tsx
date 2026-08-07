import React from 'react';
import { useStore } from '../store/useStore';
import { Search, Briefcase, Clock, Settings as SettingsIcon, LogOut, FileText, Activity, TrendingUp, Lock, GraduationCap, Layers, Crosshair, ArrowLeft, BookOpen, Trophy } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const logout = useStore((state) => state.logout);
  const userMode = useStore((state) => state.userMode);
  const watchlist = useStore((state) => state.watchlist);
  const setSelectedStock = useStore((state) => state.setSelectedStock);
  const learningMode = useStore((state) => state.learningMode);
  const toggleLearningMode = useStore((state) => state.toggleLearningMode);

  const tabs = [
    { id: 'dashboard', label: 'Market', icon: <Search className="w-4 h-4" />, proOnly: false },
    { id: 'portfolio', label: 'Portfolio', icon: <Briefcase className="w-4 h-4" />, proOnly: false },
    { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" />, proOnly: false },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" />, proOnly: false },
    { id: 'report', label: 'Journal', icon: <FileText className="w-4 h-4" />, proOnly: false },
    { id: 'analytics', label: 'Analytics', icon: <Activity className="w-4 h-4" />, proOnly: true },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" />, proOnly: false },
  ];

  return (

    <div className="w-[220px] h-full bg-[#070a13] border-r border-border flex flex-col pt-6 font-sans shrink-0 z-20 shadow-2xl">
      <div className="px-6 mb-8">
        <span className="text-white font-bold text-xl tracking-wide flex items-center">
          <span className="text-accent mr-1 font-black">T</span>RADERPRO
        </span>
      </div>

      <div className="px-4 mb-6">
        <button 
          onClick={toggleLearningMode}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-bold ${
            learningMode 
            ? 'bg-accent/10 border border-accent/30 text-accent shadow-[0_0_15px_rgba(37,99,235,0.15)]' 
            : 'bg-panel border border-border text-gray-400 hover:text-white hover:border-gray-600'
          }`}
        >
          <div className="flex items-center space-x-2">
            <GraduationCap className={`w-5 h-5 ${learningMode ? 'text-accent' : 'text-gray-500'}`} />
            <span className="text-sm">Academy Mode</span>
          </div>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${learningMode ? 'bg-accent' : 'bg-gray-700'}`}>
            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${learningMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </div>
        </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {learningMode ? (
          <>
            <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3 px-4 mt-2">Study Modules</div>
            
            <button onClick={() => { document.getElementById('candlesticks')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
              <Layers className="w-4 h-4 text-accent/70 group-hover:text-accent transition-colors" />
              <span className="text-sm">Candlestick Patterns</span>
            </button>
            <button onClick={() => { document.getElementById('snr')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
              <TrendingUp className="w-4 h-4 text-warning/70 group-hover:text-warning transition-colors" />
              <span className="text-sm">Support & Resistance</span>
            </button>
            <button onClick={() => { document.getElementById('playbook')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
              <BookOpen className="w-4 h-4 text-success/70 group-hover:text-success transition-colors" />
              <span className="text-sm">Execution Playbook</span>
            </button>
            <button onClick={() => { document.getElementById('sandbox')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors group">
              <Crosshair className="w-4 h-4 text-purple-400/70 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm">Interactive Sandbox</span>
            </button>

            <div className="mt-8 border-t border-border pt-4">
              <button 
                onClick={toggleLearningMode}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs tracking-wider">BACK TO TRADING</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 px-4">Menu</div>
        {tabs.map((tab) => {
          const isLocked = tab.proOnly && userMode !== 'Professional';
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${isLocked ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center space-x-3">
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </div>
              {isLocked && <Lock className="w-3 h-3 text-gray-600 group-hover:text-warning transition-colors" />}
            </button>
          );
        })}

        <div className="mt-8">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 px-4">Watchlist</div>
          <div className="space-y-1">
            {watchlist.length === 0 ? (
              <div className="px-4 py-4 text-[10px] text-gray-600 font-medium italic bg-white/2 inset-0 rounded-lg border border-dashed border-border/50 text-center">
                Empty Watchlist.<br/>Star stocks to track.
              </div>
            ) : (
              watchlist.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => {
                    setSelectedStock(symbol);
                    setActiveTab('dashboard');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent opacity-50 group-hover:opacity-100"></div>
                    <span className="font-bold tracking-tighter">{symbol}</span>
                  </div>
                  <TrendingUp className="w-3 h-3 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            )}
          </div>
        </div>
          </>
        )}
      </nav>

      <div className="mt-auto flex flex-col">
        <button 
          onClick={logout}
          className="w-full flex items-center space-x-3 px-6 py-5 text-danger hover:bg-danger/10 border-t border-border transition-colors duration-200 text-sm font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
