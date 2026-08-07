import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle2, XCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import { useStore, JournalEntry } from '../store/useStore';
import { exportToCSV } from '../utils/exportUtils';

const JournalEntryForm = ({ 
  entry, 
  onSave, 
  onCancel 
}: { 
  entry?: JournalEntry | null, 
  onSave: (e: any) => void, 
  onCancel: () => void 
}) => {
  const [formData, setFormData] = useState<Partial<JournalEntry>>(entry || {
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    asset: '', segment: 'Equity', type: 'BUY', entry: 0, exit: 0, qty: 1,
    stopLoss: 0, target: 0, setup: '', timeframe: '5 min', indicators: '',
    expectedRR: '', actualRR: '', pnl: 0, pnlPct: 0, status: 'Open',
    emotionBefore: '', emotionAfter: '', mistake: '', disciplineScore: 5, notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: ['entry', 'exit', 'qty', 'stopLoss', 'target', 'pnl', 'pnlPct', 'disciplineScore'].includes(name) ? Number(value) : value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0d14] border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-[#0a0d14] z-10">
          <h2 className="text-xl font-bold text-white">{entry ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Trade Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="text-xs text-gray-500 mb-1 block">Date</label><input type="text" name="date" value={formData.date || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Asset</label><input type="text" name="asset" value={formData.asset || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white placeholder-gray-600" placeholder="e.g. RELIANCE" /></div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <select name="type" value={formData.type || 'BUY'} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Entry Price</label><input type="number" name="entry" value={formData.entry || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Exit Price</label><input type="number" name="exit" value={formData.exit || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Quantity</label><input type="number" name="qty" value={formData.qty || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" /></div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Strategy & Result</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="text-xs text-gray-500 mb-1 block">Setup</label><input type="text" name="setup" value={formData.setup || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" placeholder="e.g. Breakout" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">PnL</label><input type="number" name="pnl" value={formData.pnl || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" /></div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select name="status" value={formData.status || 'Open'} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white">
                  <option value="Win">Win</option>
                  <option value="Loss">Loss</option>
                  <option value="Open">Open</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Psychology & Views</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><label className="text-xs text-gray-500 mb-1 block">Emotion Before Trade</label><input type="text" name="emotionBefore" value={formData.emotionBefore || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" placeholder="e.g. Confident, FOMO" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Discipline Score (1-10)</label><input type="number" name="disciplineScore" value={formData.disciplineScore || ''} onChange={handleChange} className="w-full bg-background border border-border rounded-lg p-2 text-white" max="10" min="1" /></div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes / User Views</label>
              <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={4} className="w-full bg-background border border-border rounded-lg p-2 text-white placeholder-gray-600" placeholder="Add your detailed views, what went right/wrong, and lessons learned..."></textarea>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-border flex justify-end space-x-3 bg-[#0a0d14] sticky bottom-0 z-10">
          <button onClick={onCancel} className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={() => onSave(formData)} className="bg-accent hover:bg-blue-600 px-6 py-2 rounded-lg font-bold text-white transition-colors">Save Entry</button>
        </div>
      </div>
    </div>
  );
};

const Report = () => {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry, trades } = useStore();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (!selectedEntry && journalEntries.length > 0) {
      setSelectedEntry(journalEntries[0]);
    } else if (journalEntries.length === 0) {
      setSelectedEntry(null);
    }
  }, [journalEntries, selectedEntry]);

  const handleExportCSV = () => {
    const dataToExport = journalEntries.map(e => ({
      Date: e.date,
      Asset: e.asset,
      Type: e.type,
      Entry: e.entry,
      Exit: e.exit,
      PnL: e.pnl,
      Setup: e.setup,
      Emotion: e.emotionBefore
    }));
    exportToCSV(dataToExport, `trading_journal_${new Date().getTime()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEntry = (data: any) => {
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, data);
      if (selectedEntry?.id === editingEntry.id) {
        setSelectedEntry({ ...selectedEntry, ...data });
      }
    } else {
      addJournalEntry(data);
    }
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      deleteJournalEntry(id);
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 h-full flex flex-col overflow-hidden relative">
      {isFormOpen && (
        <JournalEntryForm 
          entry={editingEntry} 
          onSave={handleSaveEntry} 
          onCancel={() => { setIsFormOpen(false); setEditingEntry(null); }} 
        />
      )}

      <div className="flex justify-between items-center border-b border-border pb-6 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Trading Journal</h1>
          <p className="text-gray-400">Log your trades, add views, and analyze your psychology.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}
            className="flex items-center space-x-2 bg-success hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-[#0a0d14] border border-border hover:border-accent text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-[#0a0d14] border border-border hover:border-accent text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 overflow-hidden">
        {/* Left - Tabular View */}
        <div className="col-span-12 lg:col-span-7 bg-panel border border-border rounded-xl flex flex-col overflow-hidden shadow-xl">
           <div className="p-6 border-b border-border bg-[#0a0d14]/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Tabular View</h3>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-[#0a0d14] text-[10px] text-gray-500 uppercase tracking-widest sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-4 font-bold">Date</th>
                      <th className="px-4 py-4 font-bold">Asset</th>
                      <th className="px-4 py-4 font-bold">Type</th>
                      <th className="px-4 py-4 font-bold">Entry</th>
                      <th className="px-4 py-4 font-bold">Exit</th>
                      <th className="px-4 py-4 font-bold">PnL</th>
                      <th className="px-4 py-4 font-bold">Setup</th>
                      <th className="px-4 py-4 font-bold">Emotion</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border">
                    {journalEntries.map((entry) => (
                      <tr 
                        key={entry.id} 
                        onClick={() => setSelectedEntry(entry)}
                        className={`transition-colors cursor-pointer ${selectedEntry?.id === entry.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <td className="px-4 py-4 text-gray-400 text-xs">{entry.date}</td>
                        <td className="px-4 py-4 text-white font-bold">{entry.asset}</td>
                        <td className="px-4 py-4 font-bold">
                          <span className={entry.type === 'BUY' ? 'text-success' : 'text-danger'}>{entry.type}</span>
                        </td>
                        <td className="px-4 py-4 text-gray-300 font-mono">{entry.entry}</td>
                        <td className="px-4 py-4 text-gray-300 font-mono">{entry.exit}</td>
                        <td className="px-4 py-4 font-bold">
                           <span className={entry.pnl >= 0 ? 'text-success' : 'text-danger'}>
                             {entry.pnl >= 0 ? '+' : ''}{entry.pnl}
                           </span>
                        </td>
                        <td className="px-4 py-4 text-gray-300 truncate max-w-[100px]">{entry.setup}</td>
                        <td className="px-4 py-4 text-gray-400 truncate max-w-[100px]">{entry.emotionBefore}</td>
                      </tr>
                    ))}
                    {journalEntries.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No journal entries yet. Click "Add Entry" to create one.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Right - Detailed Entry View */}
        <div className="col-span-12 lg:col-span-5 bg-panel border border-border rounded-xl p-6 overflow-y-auto custom-scrollbar shadow-xl relative">
           {selectedEntry ? (
             <>
               <div className="flex justify-between items-start mb-6">
                 <h2 className="text-xl font-bold text-white uppercase tracking-tight">Trade Details</h2>
                 <div className="flex space-x-2">
                   <button 
                     onClick={() => { setEditingEntry(selectedEntry); setIsFormOpen(true); }}
                     className="p-2 bg-[#0a0d14] border border-border rounded hover:border-accent text-gray-400 hover:text-white transition-colors"
                     title="Edit Entry"
                   >
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => handleDelete(selectedEntry.id)}
                     className="p-2 bg-[#0a0d14] border border-border rounded hover:border-danger text-gray-400 hover:text-danger transition-colors"
                     title="Delete Entry"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>
               
               <div className="space-y-6">
                 {/* Section 1 */}
                 <div>
                   <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 border-b border-border/50 pb-2">🧾 Trade Details</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div><span className="text-gray-500">Date:</span> <span className="text-white font-medium">{selectedEntry.date}</span></div>
                     <div><span className="text-gray-500">Asset:</span> <span className="text-white font-medium">{selectedEntry.asset}</span></div>
                     <div><span className="text-gray-500">Segment:</span> <span className="text-white font-medium">{selectedEntry.segment}</span></div>
                     <div><span className="text-gray-500">Type:</span> <span className={selectedEntry.type === 'BUY' ? 'text-success font-bold' : 'text-danger font-bold'}>{selectedEntry.type}</span></div>
                     <div><span className="text-gray-500">Entry:</span> <span className="text-white font-mono">₹{selectedEntry.entry}</span></div>
                     <div><span className="text-gray-500">Exit:</span> <span className="text-white font-mono">₹{selectedEntry.exit}</span></div>
                     <div><span className="text-gray-500">Qty:</span> <span className="text-white font-medium">{selectedEntry.qty}</span></div>
                     <div><span className="text-gray-500">SL:</span> <span className="text-white font-mono">₹{selectedEntry.stopLoss}</span></div>
                     {selectedEntry.target && <div><span className="text-gray-500">Target:</span> <span className="text-white font-mono">₹{selectedEntry.target}</span></div>}
                   </div>
                 </div>

                 {/* Section 2 */}
                 <div>
                   <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 border-b border-border/50 pb-2">📈 Strategy Info</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div><span className="text-gray-500">Setup:</span> <span className="text-white font-medium">{selectedEntry.setup}</span></div>
                     <div><span className="text-gray-500">Timeframe:</span> <span className="text-white font-medium">{selectedEntry.timeframe}</span></div>
                     {selectedEntry.indicators && <div className="col-span-2"><span className="text-gray-500">Indicators:</span> <span className="text-white font-medium">{selectedEntry.indicators}</span></div>}
                     {selectedEntry.expectedRR && <div><span className="text-gray-500">Exp R:R:</span> <span className="text-white font-medium">{selectedEntry.expectedRR}</span></div>}
                     {selectedEntry.actualRR && <div><span className="text-gray-500">Act R:R:</span> <span className="text-white font-medium">{selectedEntry.actualRR}</span></div>}
                   </div>
                 </div>

                 {/* Section 3 */}
                 <div>
                   <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 border-b border-border/50 pb-2">💰 Result</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm items-center">
                     <div>
                       <span className="text-gray-500">PnL:</span> 
                       <span className={`ml-2 font-bold ${selectedEntry.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                         {selectedEntry.pnl >= 0 ? '+' : ''}₹{Math.abs(selectedEntry.pnl)}
                       </span>
                     </div>
                     {selectedEntry.pnlPct && (
                       <div>
                         <span className="text-gray-500">PnL %:</span> 
                         <span className={`ml-2 font-bold ${selectedEntry.pnlPct >= 0 ? 'text-success' : 'text-danger'}`}>
                           {selectedEntry.pnlPct >= 0 ? '+' : ''}{selectedEntry.pnlPct}%
                         </span>
                       </div>
                     )}
                     <div className="col-span-2 flex items-center space-x-2">
                       <span className="text-gray-500">Status:</span> 
                       {selectedEntry.status === 'Win' ? (
                         <span className="flex items-center text-success font-bold"><CheckCircle2 className="w-4 h-4 mr-1" /> Win</span>
                       ) : selectedEntry.status === 'Loss' ? (
                         <span className="flex items-center text-danger font-bold"><XCircle className="w-4 h-4 mr-1" /> Loss</span>
                       ) : (
                         <span className="flex items-center text-warning font-bold">Open</span>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Section 4 */}
                 <div>
                   <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 border-b border-border/50 pb-2">🧠 Psychology</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div><span className="text-gray-500">Emotion:</span> <span className="text-white font-medium">{selectedEntry.emotionBefore}</span></div>
                     {selectedEntry.emotionAfter && <div><span className="text-gray-500">After Trade:</span> <span className="text-white font-medium">{selectedEntry.emotionAfter}</span></div>}
                     <div className="col-span-2"><span className="text-gray-500">Mistake:</span> <span className="text-white font-medium">{selectedEntry.mistake}</span></div>
                     <div><span className="text-gray-500">Discipline:</span> <span className="text-white font-medium">{selectedEntry.disciplineScore}/10</span></div>
                   </div>
                 </div>

                 {/* Section 5 */}
                 <div>
                   <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 border-b border-border/50 pb-2">📝 Views / Notes</h3>
                   <p className="text-sm text-gray-300 leading-relaxed bg-background/50 p-4 rounded-lg border border-border/50 whitespace-pre-wrap">
                     {selectedEntry.notes || 'No views or notes added.'}
                   </p>
                 </div>
               </div>
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-500">
               <FileText className="w-16 h-16 mb-4 opacity-20" />
               <p>Select a journal entry to view details</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Report;
