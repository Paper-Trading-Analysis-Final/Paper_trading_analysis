import React from 'react';
import { Star, Search, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';

const Watchlist = () => {
  const watchlist = useStore((state) => state.watchlist);
  const toggleWatchlist = useStore((state) => state.toggleWatchlist);
  const setSelectedStock = useStore((state) => state.setSelectedStock);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="border-b border-border pb-4">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Market Watchlist</h2>
        <p className="text-gray-400 mt-1">Track your favorite symbols for quick access.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {watchlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
            <Search className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-bold text-gray-400">Your Watchlist is Empty</p>
            <p className="text-sm">Go to the Market dashboard and click the star icon to add stocks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {watchlist.map((symbol) => (
              <div 
                key={symbol} 
                className="bg-panel p-5 rounded-xl border border-border flex flex-col justify-between hover:border-accent transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-bl-full pointer-events-none group-hover:bg-accent/10 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter">{symbol}</h3>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Live Tracking</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleWatchlist(symbol)}
                    className="text-warning hover:scale-125 transition-transform z-10"
                  >
                    <Star className="h-6 w-6 fill-warning" />
                  </button>
                </div>
                
                <div className="flex justify-between items-end">
                   <button 
                    onClick={() => setSelectedStock(symbol)}
                    className="text-accent text-[10px] font-bold border border-accent/30 px-3 py-1 rounded hover:bg-accent hover:text-white transition-all"
                   >
                     OPEN CHART
                   </button>
                   <div className="text-right">
                     <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Analytics</div>
                     <div className="text-success font-bold text-sm">+2.4% <span className="text-[10px] text-gray-600">Expected</span></div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
