import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, PieChart, Activity, Zap, ShieldCheck, Target, AlertTriangle, BarChart3, Info } from 'lucide-react';
import { useStore } from '../store/useStore';

const Analytics = () => {
  const trades = useStore((state) => state.trades);
  const realizedPnL = useStore((state) => state.realizedPnL);
  const walletBalance = useStore((state) => state.walletBalance);

  // Calculate analytics data
  const { holdings, best, worst, totalInvested, unrealizedPnL } = useMemo(() => {
    const map: Record<string, { symbol: string, qty: number, totalCost: number, currentPrice: number }> = {};
    
    trades.forEach(t => {
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
      map[t.symbol].currentPrice = t.price;
    });

    const activeHoldings = Object.values(map).filter(h => h.qty > 0);
    const sorted = [...activeHoldings].sort((a, b) => {
      const pnlA = ((a.currentPrice - (a.totalCost / a.qty)) / (a.totalCost / a.qty));
      const pnlB = ((b.currentPrice - (b.totalCost / b.qty)) / (b.totalCost / b.qty));
      return pnlB - pnlA;
    });

    const totalInv = activeHoldings.reduce((acc, h) => acc + h.totalCost, 0);
    const currVal = activeHoldings.reduce((acc, h) => acc + (h.qty * h.currentPrice), 0);

    return {
      holdings: activeHoldings,
      best: sorted[0] || null,
      worst: sorted[sorted.length - 1] || null,
      totalInvested: totalInv,
      unrealizedPnL: currVal - totalInv
    };
  }, [trades]);

  const totalReturnPct = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

  return (
    <div className="h-full flex flex-col space-y-8 max-w-[1400px] mx-auto overflow-y-auto pb-20 custom-scrollbar pr-2">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Performance Analytics</h1>
        <p className="text-gray-400 mt-2">Smart insights and detailed performance breakdown of your paper trading session.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          
          {/* 🔹 A. Performance Overview */}
          <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-8">
              <TrendingUp className="text-accent w-5 h-5" />
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Return Performance</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#0a0d14] p-5 rounded-xl border border-border/50">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-2">Total Return %</div>
                  <div className={`text-2xl font-black ${totalReturnPct >= 0 ? 'text-success' : 'text-danger'}`}>
                    {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
                  </div>
               </div>
               <div className="bg-[#0a0d14] p-5 rounded-xl border border-border/50">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-2 text-success">Best Performer</div>
                  <div className="text-lg font-bold text-white mb-1">{best?.symbol || '---'}</div>
                  <div className="text-xs font-bold text-success">
                    {best ? '+' + (((best.currentPrice - (best.totalCost / best.qty)) / (best.totalCost / best.qty)) * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
               </div>
               <div className="bg-[#0a0d14] p-5 rounded-xl border border-border/50">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-2 text-danger">Worst Performer</div>
                  <div className="text-lg font-bold text-white mb-1">{worst?.symbol || '---'}</div>
                  <div className="text-xs font-bold text-danger">
                    {worst ? (((worst.currentPrice - (worst.totalCost / worst.qty)) / (worst.totalCost / worst.qty)) * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
               </div>
            </div>
          </div>

          {/* 🔹 C. Sector Analysis (Grouped Mockup) */}
          <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
             <div className="flex items-center space-x-2 mb-8">
              <BarChart3 className="text-purple-500 w-5 h-5" />
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Sector Exposure</h2>
            </div>
            <div className="space-y-4">
               {[
                 { sector: 'Information Technology', value: 45, color: 'bg-accent', returns: '+12.4%' },
                 { sector: 'Banking & Financials', value: 30, color: 'bg-purple-500', returns: '+5.2%' },
                 { sector: 'Consumer Goods', value: 15, color: 'bg-success', returns: '-2.1%' },
                 { sector: 'Others', value: 10, color: 'bg-gray-600', returns: '+0.0%' },
               ].map((s, i) => (
                 <div key={i} className="group">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-300 font-medium">{s.sector}</span>
                      <div className="space-x-3">
                        <span className="text-gray-500 font-bold">{s.value}%</span>
                        <span className={`font-black ${s.returns.startsWith('+') ? 'text-success' : 'text-danger'}`}>{s.returns}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${s.color}`} style={{ width: `${s.value}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          
          {/* 🔹 B. P&L Breakdown */}
          <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm">
             <div className="flex items-center space-x-2 mb-6">
                <PieChart className="text-accent w-5 h-5" />
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">P&L Breakdown</h2>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-border/50">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Realized P&L</div>
                  <div className={`text-xl font-black ${realizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    ₹ {realizedPnL.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-border/50">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Unrealized P&L</div>
                  <div className={`text-xl font-black ${unrealizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    ₹ {unrealizedPnL.toLocaleString()}
                  </div>
                </div>
             </div>
          </div>

          {/* 🔹 D & E. Simple Insights & Risk */}
          <div className="bg-panel border border-border rounded-2xl p-8 shadow-sm bg-gradient-to-br from-accent/5 to-transparent relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Zap className="w-12 h-12 text-accent opacity-10" />
             </div>
             <h2 className="text-xl font-bold text-white mb-6 flex items-center">
               <ShieldCheck className="mr-2 text-success" />
               Portfolio Intelligence
             </h2>
             
             <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-success mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-200 font-bold mb-1">Steady Growth Track 📈</p>
                    <p className="text-xs text-gray-500">Your portfolio is growing steadily. The IT sector is currently your primary growth engine.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-200 font-bold mb-1">Diversification Alert</p>
                    <p className="text-xs text-gray-500">You have over 60% concentration in a single stock. Consider diversifying to reduce sector risk.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <AlertTriangle className="text-warning w-4 h-4" />
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Risk Indicator</span>
                   </div>
                   <span className="bg-warning/20 text-warning text-[10px] font-black px-3 py-1 rounded-full border border-warning/30">MEDIUM RISK</span>
                </div>
             </div>
          </div>

          {/* 🔹 F. Top Movers */}
          <div className="bg-panel border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
             <div className="flex items-center space-x-2 mb-6">
                <Activity className="text-accent w-5 h-5" />
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Today's Top Movers</h2>
             </div>
             <div className="space-y-3">
                {[
                  { sym: 'TCS.NS', chg: '+4.2%', color: 'text-success' },
                  { sym: 'RELIANCE.NS', chg: '+2.1%', color: 'text-success' },
                  { sym: 'INFY.NS', chg: '-1.8%', color: 'text-danger' },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors border-b border-border/30 last:border-0">
                    <span className="text-sm font-bold text-white">{m.sym}</span>
                    <span className={`text-xs font-black ${m.color}`}>{m.chg}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Analytics;
