import React, { useState, useRef, useEffect, useMemo } from 'react';
import TradingViewChart from '../components/TradingViewChart';
import { useStore } from '../store/useStore';
import { Star, Settings2, Search, ExternalLink, Zap } from 'lucide-react';

// Expanded stock list for autocomplete
const STOCK_LIST = [
  "TCS.NS", "TCS.BO", "RELIANCE.NS", "RELIANCE.BO", "INFY.NS", "INFY.BO",
  "TATAMOTORS.NS", "TATAMOTORS.BO", "HDFCBANK.NS", "HDFCBANK.BO",
  "SBIN.NS", "SBIN.BO", "ICICIBANK.NS", "BHARTIARTL.NS", "ITC.NS",
  "AAPL", "TSLA", "MSFT", "GOOGL", "AMZN", "NVDA", "META"
];

const Dashboard = () => {
  const selectedStock = useStore((state) => state.selectedStock);
  const setSelectedStock = useStore((state) => state.setSelectedStock);
  const user = useStore((state) => state.user);
  const walletBalance = useStore((state) => state.walletBalance);
  const setWalletBalance = useStore((state) => state.setWalletBalance);
  const resetWallet = useStore((state) => state.resetWallet);
  const userMode = useStore((state) => state.userMode);
  const toggleUserMode = useStore((state) => state.toggleUserMode);
  const addTrade = useStore((state) => state.addTrade);
  const trades = useStore((state) => state.trades);
  const watchlist = useStore((state) => state.watchlist);
  const toggleWatchlist = useStore((state) => state.toggleWatchlist);

  // All state hooks grouped at the top
  const [liveStockData, setLiveStockData] = useState({ price: 0, change: 0, changePct: 0 });
  const [marketData, setMarketData] = useState({ nifty: 24050.60, sensex: 77550.25, niftyChange: 1.16, sensexChange: 1.20 });
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [lastSync, setLastSync] = useState('');
  const [showWalletPanel, setShowWalletPanel] = useState(false);
  const [customWalletAmount, setCustomWalletAmount] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [timeframe, setTimeframe] = useState('1MO');
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState(1);
  const [stopLoss, setStopLoss] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [useProtection, setUseProtection] = useState(false);

  const walletRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  // AI Simulation (RSI & MACD) - Deterministic based on live movement
  const simulation = useMemo(() => {
    // Generate a base value derived from the symbol itself to keep it consistent
    const symbolHash = selectedStock ? selectedStock.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 30 : 50;
    
    // Adjust based on live performance (Change %)
    const performanceBias = (liveStockData.changePct || 0) * 10; 
    const r = Math.min(Math.max(symbolHash + 30 + performanceBias, 15), 85);
    
    const oversold = r < 35;
    const overbought = r > 65;
    
    let signal = "NEUTRAL";
    if (liveStockData.changePct > 1.5) signal = "BULLISH CROSSOVER";
    else if (liveStockData.changePct < -1.5) signal = "BEARISH DIVERGENCE";
    else if (liveStockData.changePct > 0.5) signal = "UPTREND CONSOLIDATION";
    else if (liveStockData.changePct < -0.5) signal = "DOWNTREND PRESSURE";

    return { 
      rsi: Math.round(r), 
      isOversold: oversold, 
      isOverbought: overbought, 
      macdSignal: signal 
    };
  }, [selectedStock, liveStockData.changePct]);

  const { rsi, isOversold, isOverbought, macdSignal } = simulation;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().trim();
    setSearchInput(val);
    if (val.length > 0) {
      // Intelligently suggest .NS and .BO if the base symbol is typed
      let filtered = STOCK_LIST.filter(s => s.includes(val));
      
      // If user types exactly a base symbol that isn't in list yet, suggest suffixes
      if (filtered.length === 0 && val.length >= 2 && !val.includes('.')) {
        filtered = [`${val}.NS`, `${val}.BO`];
      }
      
      setSuggestions(filtered.slice(0, 8)); // Limit to 8 suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchInput('');
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSelectedStock(searchInput.toUpperCase());
      setSearchInput('');
      setShowSuggestions(false);
    }
  };

  const currentHoldingQty = useMemo(() => {
    if (!selectedStock) return 0;
    return trades
      .filter(t => t.symbol === selectedStock)
      .reduce((acc, t) => {
        if (t.type === 'BUY') return acc + t.quantity;
        const sellQty = t.quantity || acc;
        return Math.max(0, acc - sellQty);
      }, 0);
  }, [trades, selectedStock]);

  const handleLiquidate = async () => {
    if (!selectedStock || liveStockData.price <= 0) return;
    if (currentHoldingQty <= 0) {
      alert(`You don't hold any positions in ${selectedStock} to liquidate.`);
      return;
    }
    if (confirm(`Are you sure you want to Liquidate all holdings of ${selectedStock}?`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            symbol: selectedStock,
            type: 'SELL',
            quantity: currentHoldingQty,
            price: liveStockData.price
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Liquidation failed');

        setWalletBalance(data.balance);
        addTrade({
          symbol: selectedStock,
          type: 'SELL',
          quantity: currentHoldingQty,
          price: liveStockData.price
        });
        alert(`All ${selectedStock} positions liquidated at ₹${liveStockData.price.toFixed(2)}.`);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleTradeExecute = async () => {
    if (!selectedStock || liveStockData.price <= 0) return;
    if (tradeAction === 'SELL' && currentHoldingQty < quantity) {
      alert(`You don't have enough shares to sell. Current holding: ${currentHoldingQty}`);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          symbol: selectedStock,
          type: tradeAction,
          quantity: quantity,
          price: liveStockData.price
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Trade failed');

      setWalletBalance(data.balance);
      addTrade({
        symbol: selectedStock,
        type: tradeAction,
        quantity: quantity,
        price: liveStockData.price
      });

      alert(`Successfully ${tradeAction === 'BUY' ? 'Bought' : 'Sold'} ${quantity} shares of ${selectedStock} at ₹${liveStockData.price.toFixed(2)}.`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      if (day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes <= 930) {
        setIsMarketOpen(true);
      } else {
        setIsMarketOpen(false);
      }
    };
    checkMarketStatus();
    const statusInterval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(statusInterval);
  }, []);



  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const [n1, s1] = await Promise.all([
          fetch('http://127.0.0.1:8000/stock/^NSEI').then(r => r.json()),
          fetch('http://127.0.0.1:8000/stock/^BSESN').then(r => r.json())
        ]);
        if (n1 && !n1.error) setMarketData(prev => ({ ...prev, nifty: n1.close, niftyChange: n1.change_pct }));
        if (s1 && !s1.error) setMarketData(prev => ({ ...prev, sensex: s1.close, sensexChange: s1.change_pct }));
        setLastSync(new Date().toLocaleTimeString());
      } catch (e) {}
    };
    fetchIndices();
    const timer = setInterval(fetchIndices, isMarketOpen ? 10000 : 60000);
    return () => clearInterval(timer);
  }, [isMarketOpen]);

  useEffect(() => {
    if (!selectedStock) return;
    const fetchStock = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/stock/${selectedStock}`).then(r => r.json());
        if (res && !res.error) {
          setLiveStockData({ price: res.close, change: res.change || 0, changePct: res.change_pct || 0 });
          setLastSync(new Date().toLocaleTimeString());
        }
      } catch (e) {}
    };
    fetchStock();
    const timer = setInterval(fetchStock, isMarketOpen ? 10000 : 60000);
    return () => clearInterval(timer);
  }, [selectedStock, isMarketOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) setShowWalletPanel(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomWalletSet = () => {
    const amount = parseFloat(customWalletAmount);
    if (!isNaN(amount)) {
      setWalletBalance(amount);
      setCustomWalletAmount('');
      setShowWalletPanel(false);
    }
  };

  // Mock News with actual search links
  const newsItems = selectedStock ? [
    { 
      title: `${selectedStock} reports significant momentum in early trade...`, 
      source: 'REUTERS', 
      date: 'Today', 
      sentiment: 'BULLISH',
      url: `https://www.google.com/search?q=${selectedStock}+stock+news&tbm=nws` 
    },
    { 
      title: `Global institutional investors monitor ${selectedStock} technicals.`, 
      source: 'CNBC', 
      date: 'Yesterday', 
      sentiment: 'NEUTRAL',
      url: `https://news.google.com/search?q=${selectedStock}` 
    },
    { 
      title: `Analyst Upgrade: Buy rating maintained for ${selectedStock} with higher targets.`, 
      source: 'BLOOMBERG', 
      date: '2h ago', 
      sentiment: 'BULLISH',
      url: `https://www.google.com/search?q=${selectedStock}+stock+analysis` 
    },
    { 
      title: `${selectedStock} enters strategic partnership for AI expansion.`, 
      source: 'TECHCRUNCH', 
      date: '4h ago', 
      sentiment: 'BULLISH',
      url: `https://www.google.com/search?q=${selectedStock}+partnership` 
    },
    { 
      title: `Market volatility impacts ${selectedStock} sector peers.`, 
      source: 'FORBES', 
      date: '6h ago', 
      sentiment: 'NEUTRAL',
      url: `https://www.google.com/search?q=${selectedStock}+sector+news` 
    },
  ] : [];

  return (
    <div className="flex flex-col h-full space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Market</h1>
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 text-sm">Welcome, {user?.username || 'Trader'}</span>
              <button 
                onClick={toggleUserMode}
                className={`text-xs font-bold px-2 py-0.5 rounded border ${userMode === 'Beginner' ? 'bg-accent/20 text-accent border-accent/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}
              >
                {userMode} Mode
              </button>
              {lastSync && <span className="text-[10px] text-gray-500 font-mono">Sync: {lastSync}</span>}
            </div>
          </div>
          
          <div className="ml-4 pl-4 border-l border-border flex items-center">
             <form ref={searchRef} onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-500 pointer-events-none" />
                <input 
                  type="text" 
                  aria-label="Search stocks"
                  value={searchInput}
                  onChange={handleSearchChange}
                  onFocus={() => { if(searchInput.length>0) setShowSuggestions(true); }}
                  placeholder="Search symbol (e.g. TCS)"
                  className="bg-[#0a0d14] border border-border focus:border-accent text-white text-sm rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none transition-colors duration-200"
                />
                <button type="submit" className="hidden">Submit</button>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-panel border border-border rounded-lg shadow-xl overflow-hidden z-[100]">
                    {suggestions.map((sym) => (
                      <div 
                        key={sym} 
                        onClick={() => selectSuggestion(sym)}
                        className="px-4 py-2 text-sm text-gray-300 hover:bg-accent/20 hover:text-white cursor-pointer"
                      >
                        {sym}
                      </div>
                    ))}
                  </div>
                )}
             </form>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-6 border-r border-border pr-6">
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Nifty 50</div>
              <div className="text-white text-sm font-bold">
                {(marketData.nifty || 0).toLocaleString()} <span className={(marketData.niftyChange || 0) >= 0 ? "text-success" : "text-danger"}>{(marketData.niftyChange || 0) >= 0 ? '+' : ''}{(marketData.niftyChange || 0).toFixed(2)}%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Sensex</div>
              <div className="text-white text-sm font-bold">
                {(marketData.sensex || 0).toLocaleString()} <span className={(marketData.sensexChange || 0) >= 0 ? "text-success" : "text-danger"}>{(marketData.sensexChange || 0) >= 0 ? '+' : ''}{(marketData.sensexChange || 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-wider">Market Status</div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center ${isMarketOpen ? 'bg-success/10 text-success border-success/30' : 'bg-danger/10 text-danger border-danger/30'}`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isMarketOpen ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
              {isMarketOpen ? 'OPEN' : 'CLOSED'}
            </div>
          </div>
          
          <div className="relative flex items-center space-x-3" ref={walletRef}>
            <div className="text-sm font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20">
              ₹ {walletBalance.toLocaleString('en-IN')}
            </div>
            <button onClick={() => setShowWalletPanel(!showWalletPanel)} className="w-10 h-10 rounded-full bg-panel border border-accent flex items-center justify-center font-bold text-accent shadow-[0_0_10px_rgba(37,99,235,0.2)]">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </button>
            {showWalletPanel && (
              <div className="absolute right-0 top-12 w-64 bg-panel border border-border rounded-xl shadow-2xl p-4 z-[100]">
                <div className="text-white text-sm font-bold border-b border-border pb-2 mb-3">Wallet Settings</div>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input type="number" value={customWalletAmount} onChange={e => setCustomWalletAmount(e.target.value)} placeholder="Value" className="w-full bg-[#0a0d14] border border-border rounded p-1.5 text-white text-xs" />
                    <button onClick={handleCustomWalletSet} className="bg-accent text-white px-2.5 py-1.5 rounded text-xs">Set</button>
                  </div>
                  <button onClick={() => { resetWallet(); setShowWalletPanel(false); }} className="w-full border border-danger text-danger py-1.5 rounded text-xs">Full Reset</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!selectedStock ? (
          <div className="h-full flex flex-col items-center justify-center bg-panel border border-border rounded-xl">
            <Search className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400">Search to Start</h2>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left - Chart */}
            <div className="col-span-8 flex flex-col space-y-3 min-h-0">
               <div className="flex justify-between">
                 <div className="flex items-start space-x-4 relative z-10">
                   <div>
                     <div className="flex items-center space-x-2">
                       <h2 className="text-2xl font-bold text-white">{selectedStock}</h2>
                       <button 
                         onClick={() => toggleWatchlist(selectedStock)} 
                         className={`p-1.5 hover:scale-125 transition-transform relative z-20 ${watchlist.includes(selectedStock) ? 'text-warning' : 'text-gray-500'}`}
                         title="Add to Watchlist"
                       >
                         <Star className={`w-6 h-6 ${watchlist.includes(selectedStock) ? 'fill-warning' : ''}`} />
                       </button>
                     </div>
                     <div className="text-2xl font-bold text-white mt-1 flex items-baseline space-x-3">
                       <span>₹ {(liveStockData.price || 0).toFixed(2)}</span>
                       <span className={`text-sm font-bold ${(liveStockData.change || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                         {(liveStockData.change || 0) >= 0 ? '+' : ''}{(liveStockData.change || 0).toFixed(2)} ({(liveStockData.changePct || 0).toFixed(2)}%)
                       </span>
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                    <div className="text-gray-400 text-[10px] flex items-center justify-end space-x-1 mb-1 font-bold tracking-wider">
                      <Zap className="w-3 h-3 text-warning" />
                      <span>AI INSIGHT</span>
                    </div>
                    <div className={`text-lg font-bold px-4 py-1 rounded border inline-block mb-1 shadow-sm ${isOversold ? 'bg-success/10 text-success border-success/30' : isOverbought ? 'bg-danger/10 text-danger border-danger/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                      {isOversold ? 'STRONG BUY' : isOverbought ? 'SELL ALERT' : 'HOLD'}
                    </div>
                    <div className="text-gray-300 text-[10px] mt-1">RSI: <span className="font-bold text-white mr-2">{rsi}</span> MACD: <span className="font-bold text-white">{macdSignal}</span></div>
                 </div>
                 <div className="flex flex-center items-center space-x-2">
                   {['1D', '1MO', '1Y'].map(tf => (
                     <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 rounded text-[10px] font-bold ${timeframe === tf ? 'bg-accent text-white' : 'text-gray-500'}`}>{tf}</button>
                   ))}
                 </div>
               </div>
               <div className="flex-1 bg-panel border border-border rounded-xl p-4 overflow-hidden relative min-h-0">
                 <TradingViewChart timeframe={timeframe} />
               </div>

               {/* Trading Panel - Moved Here */}
               <div className="bg-panel border border-border rounded-xl p-4 shadow-lg flex items-center space-x-6 shrink-0">
                  <div className="shrink-0 border-r border-border pr-6">
                    <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-widest">Trade {selectedStock}</h3>
                    <div className="flex space-x-1">
                      <button onClick={() => setTradeAction('BUY')} className={`px-4 py-1.5 rounded text-[10px] font-bold transition-all ${tradeAction === 'BUY' ? 'bg-success text-white' : 'bg-success/10 text-success'}`}>BUY</button>
                      <button onClick={() => setTradeAction('SELL')} className={`px-4 py-1.5 rounded text-[10px] font-bold transition-all ${tradeAction === 'SELL' ? 'bg-danger text-white' : 'bg-danger/10 text-danger'}`}>SELL</button>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center space-x-4">
                    <div className="w-24">
                      <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Quantity</label>
                      <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-[#0a0d14] border border-border rounded px-3 py-1.5 text-white text-xs focus:border-accent focus:outline-none" />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                       <div className="flex items-center space-x-2 mb-1">
                          <input 
                            type="checkbox" 
                            id="protection" 
                            checked={useProtection} 
                            onChange={e => setUseProtection(e.target.checked)}
                            className="w-3 h-3 rounded border-border bg-panel text-accent focus:ring-accent focus:ring-offset-0"
                          />
                          <label htmlFor="protection" className="text-[9px] text-gray-400 font-bold uppercase cursor-pointer hover:text-accent transition-colors">Protection (SL/TGT)</label>
                       </div>
                       
                       <div className={`flex space-x-2 transition-all duration-300 ${useProtection ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
                          <div className="relative flex-1">
                            <input 
                              type="number" 
                              placeholder="Stop Loss" 
                              value={stopLoss} 
                              onChange={e => setStopLoss(e.target.value)} 
                              className="w-full bg-[#0a0d14] border border-border rounded px-2 py-1 text-[10px] text-white focus:border-danger focus:outline-none placeholder:text-gray-700" 
                            />
                            {stopLoss && liveStockData.price > 0 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-danger/70">
                                {(((parseFloat(stopLoss) - liveStockData.price) / liveStockData.price) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="relative flex-1">
                            <input 
                              type="number" 
                              placeholder="Target" 
                              value={targetPrice} 
                              onChange={e => setTargetPrice(e.target.value)} 
                              className="w-full bg-[#0a0d14] border border-border rounded px-2 py-1 text-[10px] text-white focus:border-success focus:outline-none placeholder:text-gray-700" 
                            />
                            {targetPrice && liveStockData.price > 0 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-success/70">
                                +{(((parseFloat(targetPrice) - liveStockData.price) / liveStockData.price) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-end space-x-2">
                      <div className="flex flex-col items-center justify-center px-3 border-r border-border/50">
                        <div className="text-[8px] text-gray-500 font-bold uppercase mb-1">R:R</div>
                        <div className="text-[10px] font-bold text-white">
                          {stopLoss && targetPrice ? (Math.abs((parseFloat(targetPrice)-liveStockData.price)/(parseFloat(stopLoss)-liveStockData.price))).toFixed(1) : '--'}
                        </div>
                      </div>
                      <button onClick={handleTradeExecute} className={`px-6 py-2 rounded text-xs font-bold text-white shadow-lg transition-all ${tradeAction === 'BUY' ? 'bg-success hover:bg-green-600' : 'bg-danger hover:bg-red-600'}`}>
                        CONFIRM {tradeAction}
                      </button>
                      <button onClick={handleLiquidate} className="px-3 py-2 bg-transparent border border-danger/30 text-danger hover:bg-danger hover:text-white rounded text-[10px] font-bold transition-colors" title="Close all positions">
                        EXIT
                      </button>
                    </div>
                  </div>
               </div>
            </div>

            {/* Right - Panel */}
            <div className="col-span-4 flex flex-col space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
              <div className="flex items-center justify-between px-1 shrink-0">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Latest News</div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Live</span>
                </div>
              </div>

              {newsItems.map((news, i) => (
                <a 
                  key={i} 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-panel border border-border rounded-xl p-4 hover:border-accent/50 transition-all hover:bg-white/5 block group"
                >
                  <h4 className="text-sm font-bold text-gray-200 mb-2 group-hover:text-accent transition-colors">{news.title}</h4>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    <span>{news.source}</span>
                    <span className={`px-1.5 py-0.5 rounded ${news.sentiment === 'BULLISH' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {news.sentiment}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
