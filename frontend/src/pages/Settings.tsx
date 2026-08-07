import React, { useState } from 'react';
import { ShieldAlert, Trash2, Key, RotateCcw, History, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

const Settings = () => {
  const resetAll = useStore((state) => state.resetAll);
  const clearHistory = useStore((state) => state.clearHistory);
  const walletBalance = useStore((state) => state.walletBalance);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password updated successfully.');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you completely sure you want to delete your account? This cannot be undone.')) {
      alert('Account deleted.');
    }
  };

  const handleResetAll = () => {
    if (confirm('COMPLETELY RESET ALL DATA? This will wipe your Portfolio, History, and Watchlist. Wallet will return to ₹ 10,00,000.')) {
      resetAll();
      alert('Application data reset successfully.');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Permanently clear all trade history?')) {
      clearHistory();
      alert('Trade history cleared.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Security / Password */}
        <div className="bg-panel border border-border rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <Key className="text-accent w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Security</h2>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#0a0d14] border border-border rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0a0d14] border border-border rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button type="submit" className="bg-accent hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors mt-2">
              Update Password
            </button>
          </form>
        </div>

        {/* App Data Reset */}
        <div className="bg-panel border border-border rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <RotateCcw className="text-warning w-6 h-6" />
            <h2 className="text-xl font-bold text-white">App Data</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              Reset your simulated trading session data without deleting your account.
            </p>
            
            <div className="flex flex-col space-y-2">
              <button 
                onClick={handleResetAll}
                className="flex items-center justify-between w-full p-4 bg-danger/5 border border-danger/20 rounded-lg hover:bg-danger/10 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-4 h-4 text-danger" />
                  <div className="text-left">
                    <span className="text-sm font-bold text-gray-200 block">Full System Reset</span>
                    <span className="text-[10px] text-gray-500 uppercase">Wipes Portfolio, History, & Watchlist</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-danger transition-colors" />
              </button>

              <button 
                onClick={handleClearHistory}
                className="flex items-center justify-between w-full p-4 bg-white/5 border border-border rounded-lg hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <History className="w-4 h-4 text-warning" />
                  <span className="text-sm font-bold text-gray-200">Clear History Only</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-warning transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-panel border border-danger/30 rounded-xl p-6 shadow-lg relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-danger/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center space-x-3 mb-6">
            <ShieldAlert className="text-danger w-6 h-6" />
            <h2 className="text-xl font-bold text-danger">Danger Zone</h2>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
              Once you delete your account, there is no going back. All your paper trading history, watchlists, and portfolio data will be permanently wiped from our servers.
            </p>

            <button 
              onClick={handleDeleteAccount}
              className="flex items-center space-x-2 bg-danger/10 border border-danger/50 hover:bg-danger text-danger hover:text-white font-bold py-2.5 px-10 rounded-lg transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
