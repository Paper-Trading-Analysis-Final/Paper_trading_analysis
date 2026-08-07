import React, { useEffect, useState } from 'react';
import { Trophy, Award, Target, Zap, ShieldCheck } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  net_worth: number;
  return_percent: number;
  win_rate: number;
  xp: number;
  level: number;
}

interface BadgeItem {
  id: number;
  name: string;
  description: string;
  unlocked_at: string | null;
}

interface UserGamification {
  xp: number;
  level: number;
  badges: BadgeItem[];
  total_trades: number;
  total_wins: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userGamification, setUserGamification] = useState<UserGamification | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Leaderboard
        const lbRes = await fetch('http://127.0.0.1:8000/leaderboard');
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setLeaderboard(lbData);
        }

        // Fetch User Gamification
        const token = localStorage.getItem('token');
        if (token) {
          const gamiRes = await fetch('http://127.0.0.1:8000/user/gamification', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (gamiRes.ok) {
            const gamiData = await gamiRes.json();
            setUserGamification(gamiData);
          }
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gamification level progress calculation
  const currentXP = userGamification?.xp || 0;
  const currentLevel = userGamification?.level || 1;
  const xpInCurrentLevel = currentXP % 500;
  const progressPct = Math.min(Math.max((xpInCurrentLevel / 500) * 100, 0), 100);
  const xpToNextLevel = 500 - xpInCurrentLevel;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-border pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Leaderboard</h1>
          <p className="text-gray-400">Top performing traders ranked by net worth and returns.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ranked Traders</div>
          <div className="text-xl font-black text-white">{leaderboard.length} Traders</div>
        </div>
      </div>

      {/* User Gamification Summary */}
      {userGamification && (
        <div className="bg-panel border border-border rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-warning" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Your Performance Summary</h2>
            </div>
            <span className="text-xs bg-accent/10 border border-accent/30 text-accent font-bold px-3 py-1 rounded-full">
              Level {currentLevel} Trader
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Level & XP Card */}
            <div className="bg-[#0a0d14]/50 border border-border p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Level & XP</span>
                <span className="text-accent font-bold">{currentXP} XP</span>
              </div>
              <div className="text-2xl font-extrabold text-white">
                Level {currentLevel}
              </div>
              <div className="space-y-1">
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-accent h-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-400 text-right">
                  {xpToNextLevel} XP to Level {currentLevel + 1}
                </div>
              </div>
            </div>

            {/* Total Trades Card */}
            <div className="bg-[#0a0d14]/50 border border-border p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Total Trades</span>
                <Target className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-2xl font-extrabold text-white">
                {userGamification.total_trades}
              </div>
              <div className="text-[11px] text-gray-400">
                Executed orders
              </div>
            </div>

            {/* Total Wins Card */}
            <div className="bg-[#0a0d14]/50 border border-border p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Profitable Trades</span>
                <ShieldCheck className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-extrabold text-success">
                {userGamification.total_wins}
              </div>
              <div className="text-[11px] text-gray-400">
                Win Rate: {userGamification.total_trades > 0 ? Math.round((userGamification.total_wins / userGamification.total_trades) * 100) : 0}%
              </div>
            </div>

            {/* Badges Card */}
            <div className="bg-[#0a0d14]/50 border border-border p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Unlocked Badges</span>
                <Award className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-extrabold text-white">
                {userGamification.badges.length}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {userGamification.badges.length === 0 ? (
                  <span className="text-[11px] text-gray-500">No badges unlocked yet</span>
                ) : (
                  userGamification.badges.map((b) => (
                    <span 
                      key={b.id} 
                      title={b.description}
                      className="text-[10px] bg-accent/10 border border-accent/30 text-accent font-bold px-2 py-0.5 rounded"
                    >
                      🏆 {b.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Rankings Table */}
      <div className="bg-panel border border-border rounded-xl flex flex-col overflow-hidden shadow-2xl min-h-[450px]">

        <div className="p-6 border-b border-border bg-[#0a0d14]/50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Rankings</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500 py-20">
              <p className="text-sm font-medium">Loading rankings...</p>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-danger py-20">
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 py-20">
              <p className="text-sm font-medium">No leaderboard data available.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#0a0d14] text-[10px] text-gray-500 uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-bold">Rank</th>
                  <th className="px-6 py-4 font-bold">Username</th>
                  <th className="px-6 py-4 font-bold">Net Worth</th>
                  <th className="px-6 py-4 font-bold">Return %</th>
                  <th className="px-6 py-4 font-bold">Win Rate</th>
                  <th className="px-6 py-4 font-bold">XP</th>
                  <th className="px-6 py-4 font-bold">Level</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-border">
                {leaderboard.map((entry) => {
                  const isPositiveReturn = entry.return_percent >= 0;
                  return (
                    <tr key={entry.rank} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">#{entry.rank}</td>
                      <td className="px-6 py-4 text-white font-medium">{entry.username}</td>
                      <td className="px-6 py-4 text-gray-300 font-mono">
                        ₹ {entry.net_worth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-6 py-4 font-bold font-mono ${isPositiveReturn ? 'text-success' : 'text-danger'}`}>
                        {isPositiveReturn ? '+' : ''}{entry.return_percent}%
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono">{entry.win_rate}%</td>
                      <td className="px-6 py-4 text-accent font-bold font-mono">{entry.xp} XP</td>
                      <td className="px-6 py-4 text-gray-300 font-bold">Lvl {entry.level}</td>
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

export default Leaderboard;
