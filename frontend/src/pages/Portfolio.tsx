import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, PieChart, Activity, ArrowRight, Plus, Minus, Info } from 'lucide-react';
import { useStore } from '../store/useStore';

const Portfolio = () => {
  const trades = useStore((state) => state.trades);
  const walletBalance = useStore((state) => state.walletBalance);
  const portfolioHistory = useStore((state) => state.portfolioHistory);
  const setSelectedStock = useStore((state) => state.setSelectedStock);

  // Calculate detailed holdings
  const holdings = useMemo(() => {
    const map: Record<string, { symbol: string, qty: number, totalCost: number, currentPrice: number }> = {};
    
    // Process trades
    [...trades].reverse().forEach(t => {
      if (!map[t.symbol]) map[t.symbol] = { symbol: t.symbol, qty: 0, totalCost: 0, currentPrice: t.price };
      
      if (t.type === 'BUY') {
        map[t.symbol].qty += t.quantity;
        map[t.symbol].totalCost += (t.quantity * t.price);
      } else {
        if (!map[t.symbol] || map[t.symbol].qty <= 0) return;

        const sellQty = t.quantity || map[t.symbol].qty;
        map[t.symbol].qty = Math.max(0, map[t.symbol].qty - sellQty);
        
        if (map[t.symbol].qty === 0) map[t.symbol].totalCost = 0;
      }
      map[t.symbol].currentPrice = t.price; // Simplified: last trade price is LTP
    });

    return Object.values(map).filter(h => h.qty > 0);
  }, [trades]);

  const totalInvested = holdings.reduce((acc, h) => acc + h.totalCost, 0);
  const currentValue = holdings.reduce((acc, h) => acc + (h.qty * h.currentPrice), 0);
  const totalPnL = currentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const todayPnL = totalPnL * 0.15; // Mocked today's movement

  return (
    <div className="h-full flex flex-col space-y-8 max-w-[1400px] mx-auto overflow-y-auto pb-20 custom-scrollbar pr-2">
      
      {/* 🔹 A. Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Investment</div>
          <div className="text-2xl font-black text-white">₹ {totalInvested.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Value</div>
          <div className="text-2xl font-black text-white">₹ {currentValue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total P&L</div>
          <div className={`text-2xl font-black ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalPnL >= 0 ? '+' : ''}₹ {Math.abs(totalPnL).toLocaleString('en-IN')}
            <span className="text-xs ml-2 font-bold opacity-80">({pnlPercent.toFixed(2)}%)</span>
          </div>
        </div>
        <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm bg-accent/5 border-accent/20">
          <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Today's P&L</div>
          <div className={`text-2xl font-black ${todayPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {todayPnL >= 0 ? '+' : ''}₹ {Math.abs(todayPnL).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* 🔹 B. Holdings List */}
          <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center">
               <h2 className="text-lg font-bold text-white uppercase tracking-tight">Holdings ({holdings.length})</h2>
               <div className="text-[10px] text-gray-500 font-bold">SORT BY: P&L %</div>
            </div>
            {holdings.length === 0 ? (
              <div className="p-20 text-center text-gray-500 italic">No holdings found. Start trading to build your portfolio.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0a0d14] text-[10px] text-gray-500 uppercase tracking-widest font-black">
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Qty</th>
                    <th className="px-6 py-4 text-right">Avg Buy</th>
                    <th className="px-6 py-4 text-right">LTP</th>
                    <th className="px-6 py-4 text-right">Profit / Loss</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border/30">
                  {holdings.map((h, i) => {
                    const hPnL = (h.currentPrice - (h.totalCost / h.qty)) * h.qty;
                    const hPnLPct = ((h.currentPrice - (h.totalCost / h.qty)) / (h.totalCost / h.qty)) * 100;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedStock(h.symbol)}>
                        <td className="px-6 py-4">
                          <div className="text-white font-bold">{h.symbol}</div>
                          <div className="text-[9px] text-accent font-bold uppercase tracking-tighter">Equity</div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300 font-mono">{h.qty}</td>
                        <td className="px-6 py-4 text-right text-gray-300 font-mono">₹ {(h.totalCost / h.qty).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-white font-black font-mono">₹ {h.currentPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className={`font-bold ${hPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                            {hPnL >= 0 ? '+' : ''}₹ {Math.abs(hPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] font-black ${hPnL >= 0 ? 'text-success' : 'text-danger'} opacity-80`}>
                            {hPnL >= 0 ? '+' : ''}{hPnLPct.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Col - Allocation & Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* 🔹 D. Allocation View */}
          <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="flex items-center space-x-2 mb-8">
                <PieChart className="text-accent w-5 h-5" />
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Allocation</h2>
             </div>
             
             {holdings.length === 0 ? (
               <div className="py-10 text-center text-gray-600 text-xs">Execute trades to see diversification.</div>
             ) : (
               <div className="space-y-6">
                  <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                    {holdings.map((h, i) => (
                      <div 
                        key={i} 
                        className="h-full border-r border-background/20" 
                        style={{ 
                          width: `${(h.totalCost / totalInvested) * 100}%`,
                          backgroundColor: `hsl(${210 + i * 40}, 70%, 50%)`
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {holdings.map((h, i) => {
                      const pct = ((h.totalCost / totalInvested) * 100).toFixed(1);
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${210 + i * 40}, 70%, 50%)` }}></div>
                            <span className="text-xs font-bold text-gray-300">{h.symbol}</span>
                          </div>
                          <span className="text-xs font-black text-white">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
               </div>
             )}
          </div>

          {/* 🔹 E. Actions Panel */}
          <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
             <div className="flex items-center space-x-2 mb-6">
                <Info className="text-warning w-5 h-5" />
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Portfolio Health</h2>
             </div>
             <div className="space-y-4">
                <p className="text-gray-400 text-xs leading-relaxed">
                  Your portfolio is currently concentrated in <span className="text-white font-bold">{holdings[0]?.symbol || 'N/A'}</span>. Diversifying into other sectors could reduce volatility.
                </p>
                <div className="flex flex-col space-y-2 pt-2">
                  <button className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all">
                    <Plus className="w-4 h-4" />
                    <span>BUY MORE ASSETS</span>
                  </button>
                  <button className="w-full bg-danger/10 border border-danger/30 text-danger hover:bg-danger hover:text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all">
                    <Minus className="w-4 h-4" />
                    <span>LIQUIDATE POSITIONS</span>
                  </button>
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Portfolio;
