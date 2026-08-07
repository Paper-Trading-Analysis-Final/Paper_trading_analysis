import React, { useState, useEffect, useRef } from 'react';
import { Search, LogOut, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

const indianStocks = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'Technology' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'Technology' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
];

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [gamification, setGamification] = useState<{ level: number; xp: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const logout = useStore((state) => state.logout);
  const user = useStore((state) => state.user);
  const setSelectedStock = useStore((state) => state.setSelectedStock);

  const filteredStocks = indianStocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchGamification = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/user/gamification', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGamification({ level: data.level, xp: data.xp });
        }
      } catch (e) {
        // silent
      }
    };

    fetchGamification();
  }, []);

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-panel border-b border-accent/20 shrink-0">
      <div className="flex items-center">
        <span className="text-accent font-bold text-xl tracking-wider">🚀 PAPER TRADING PRO</span>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative" ref={dropdownRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted" />
          </div>
          <input
            type="text"
            className="w-[250px] bg-background border border-accent/30 text-text rounded pl-10 pr-4 py-1.5 focus:outline-none focus:border-accent"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          
          {showDropdown && searchQuery && (
            <div className="absolute top-full mt-1 w-full bg-panel border border-accent/30 rounded shadow-lg overflow-hidden z-50 max-h-[300px] overflow-y-auto">
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => (
                  <div 
                    key={stock.symbol} 
                    className="px-4 py-2 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                    onClick={() => handleSelectStock(stock.symbol)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-accent">{stock.symbol}</span>
                      <span className="text-xs text-muted px-2 py-0.5 bg-background rounded">{stock.sector}</span>
                    </div>
                    <div className="text-sm text-text truncate">{stock.name}</div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted">No stocks found.</div>
              )}
            </div>
          )}
        </div>
        
        {gamification && (
          <div className="flex items-center space-x-2 bg-accent/10 border border-accent/30 text-accent text-xs font-bold px-3 py-1.5 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-warning" />
            <span>Lvl {gamification.level}</span>
            <span className="text-gray-500">•</span>
            <span>{gamification.xp} XP</span>
          </div>
        )}

        <div className="text-sm text-muted">
          Welcome, {user?.username || 'Trader'}
        </div>
        
        <button 
          onClick={() => logout()}
          className="flex items-center space-x-2 bg-danger/10 text-danger hover:bg-danger hover:text-white px-3 py-1.5 rounded transition-colors duration-200 border border-danger/30"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

