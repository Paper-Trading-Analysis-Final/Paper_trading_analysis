import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Watchlist from './pages/Watchlist';
import News from './pages/News';
import History from './pages/History';
import Settings from './pages/Settings';
import Report from './pages/Report';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import { useStore } from './store/useStore';
import { ShieldCheck, Zap, Lock } from 'lucide-react';
import LearningHub from './pages/LearningHub';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const userMode = useStore((state) => state.userMode);
  const toggleUserMode = useStore((state) => state.toggleUserMode);
  const learningMode = useStore((state) => state.learningMode);

  const hasToken = typeof window !== 'undefined' ? Boolean(localStorage.getItem('token')) : false;

  if (!isAuthenticated || !hasToken) {
    return <Auth />;
  }


  const renderContent = () => {
    if (learningMode) {
      return <LearningHub />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'portfolio': return <Portfolio />;
      case 'leaderboard': return <Leaderboard />;
      case 'analytics': 
        if (userMode === 'Professional') {

          return <Analytics />;
        } else {
          return (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 max-w-2xl mx-auto">
               <div className="bg-purple-500/10 p-6 rounded-full mb-8 relative">
                 <Lock className="w-16 h-16 text-purple-400" />
                 <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded animate-bounce">PRO</div>
               </div>
               <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Institutional Analytics</h2>
               <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                 Access real-time option chains, Greek calculations (Delta, Gamma, Theta), and deep sentiment analysis used by professional traders.
               </p>
               <div className="grid grid-cols-2 gap-4 w-full mb-10">
                  <div className="bg-panel border border-border p-4 rounded-xl flex items-center space-x-3">
                    <Zap className="text-warning w-5 h-5" />
                    <span className="text-sm font-bold text-gray-200">Real-time Greeks</span>
                  </div>
                  <div className="bg-panel border border-border p-4 rounded-xl flex items-center space-x-3">
                    <ShieldCheck className="text-success w-5 h-5" />
                    <span className="text-sm font-bold text-gray-200">Chain Analysis</span>
                  </div>
               </div>
               <button 
                 onClick={() => toggleUserMode()}
                 className="bg-accent hover:bg-blue-600 text-white font-bold py-4 px-12 rounded-xl transition-all shadow-lg hover:shadow-accent/20 flex items-center space-x-3"
               >
                 <span>UNLOCK PROFESSIONAL MODE</span>
               </button>
            </div>
          );
        }
      case 'watchlist': return <Watchlist />;
      case 'news': return <News />;
      case 'history': return <History />;
      case 'report': return <Report />;
      case 'settings': return <Settings />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-text font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto bg-[#070a13] p-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
