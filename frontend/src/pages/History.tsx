import React from 'react';
import { useStore } from '../store/useStore';
import { Clock, History as HistoryIcon, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const History = () => {
  const trades = useStore((state) => state.trades);

  const handleExport = () => {
    const dataToExport = trades.map(t => ({
      Type: t.type,
      Symbol: t.symbol,
      Price: t.price,
      Quantity: t.quantity || 1,
      Total: t.price * (t.quantity || 1),
      Time: t.time,
      Status: t.status
    }));
    exportToCSV(dataToExport, `trade_history_${new Date().getTime()}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 h-full flex flex-col overflow-hidden">
      <div className="border-b border-border pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Trade History</h1>
          <p className="text-gray-400">Chronological log of all session transactions.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Session Volume</div>
          <div className="text-xl font-black text-white">{trades.length} Actions</div>
        </div>
      </div>

      <div className="flex-1 bg-panel border border-border rounded-xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border bg-[#0a0d14]/50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Transaction Audit Trail</h3>
          </div>
          <button 
            onClick={handleExport}
            className="text-[10px] text-accent font-bold hover:underline flex items-center"
          >
            EXPORT CSV <ExternalLink className="w-3 h-3 ml-1" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {trades.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
              <HistoryIcon className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-sm font-medium">No transactions recorded in this session.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#0a0d14] text-[10px] text-gray-500 uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Asset</th>
                  <th className="px-6 py-4 font-bold">Execution Price</th>
                  <th className="px-6 py-4 font-bold">Qty</th>
                  <th className="px-6 py-4 font-bold">Total Value</th>
                  <th className="px-6 py-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border">
                {trades.map((trade) => {
                  const isBuy = trade.type === 'BUY';
                  const total = (trade.price * (trade.quantity || 1));
                  return (
                    <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-bold">
                        <div className="flex items-center space-x-2">
                          {isBuy ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-danger" />
                          )}
                          <span className={isBuy ? 'text-success' : 'text-danger'}>{trade.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{trade.symbol}</td>
                      <td className="px-6 py-4 text-gray-300 font-mono">₹ {trade.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-gray-400">{trade.quantity || 'All'}</td>
                      <td className="px-6 py-4 text-white font-bold">₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-mono">{trade.time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
