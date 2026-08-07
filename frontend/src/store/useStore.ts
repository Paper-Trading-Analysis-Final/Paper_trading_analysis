import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  email: string;
  age?: string;
  gender?: string;
  location?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  time: string;
  status: 'COMPLETED' | 'PENDING';
}

export interface JournalEntry {
  id: string;
  date: string;
  asset: string;
  segment: string;
  type: 'BUY' | 'SELL';
  entry: number;
  exit: number | null;
  qty: number;
  stopLoss: number | null;
  target: number | null;
  setup: string;
  timeframe: string;
  indicators: string;
  expectedRR: string;
  actualRR: string;
  pnl: number;
  pnlPct: number | null;
  status: 'Win' | 'Loss' | 'Open';
  emotionBefore: string;
  emotionAfter: string;
  mistake: string;
  disciplineScore: number;
  notes: string;
}

interface AppState {
  isAuthenticated: boolean;
  learningMode: boolean;
  user: User | null;
  selectedStock: string;
  walletBalance: number;
  userMode: 'Beginner' | 'Professional';
  trades: Trade[];
  journalEntries: JournalEntry[];
  watchlist: string[];
  realizedPnL: number;
  portfolioHistory: { time: string, value: number }[];
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  setSelectedStock: (symbol: string) => void;
  setWalletBalance: (amount: number) => void;
  resetWallet: (amount?: number) => void;
  toggleUserMode: () => void;
  addTrade: (trade: Omit<Trade, 'id' | 'time' | 'status'>) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  clearHistory: () => void;
  toggleWatchlist: (symbol: string) => void;
  resetAll: (amount?: number) => void;
  addRealizedPnL: (amount: number) => void;
  toggleLearningMode: () => void;
}

const INITIAL_BALANCE = 1000000;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      learningMode: false,
      user: null,
      selectedStock: '',
      walletBalance: INITIAL_BALANCE,
      userMode: 'Beginner',
      trades: [],
      journalEntries: [
        {
          id: '1',
          date: '5 May 2026',
          asset: 'RELIANCE',
          segment: 'Equity',
          type: 'BUY',
          entry: 2500,
          exit: 2555,
          qty: 10,
          stopLoss: 2480,
          target: 2560,
          setup: 'Breakout',
          timeframe: '15 min',
          indicators: 'RSI + Volume',
          expectedRR: '1:2',
          actualRR: '1:1.8',
          pnl: 550,
          pnlPct: 2.2,
          status: 'Win',
          emotionBefore: 'Confident',
          emotionAfter: 'Satisfied',
          mistake: 'Slight early exit',
          disciplineScore: 8,
          notes: 'Strong breakout with high volume. Could have held till full target. Good risk management followed.'
        },
        {
          id: '2',
          date: '5 May 2026',
          asset: 'TCS',
          segment: 'Equity',
          type: 'SELL',
          entry: 3200,
          exit: 3150,
          qty: 10,
          stopLoss: 3225,
          target: null,
          setup: 'Reversal',
          timeframe: '5 min',
          indicators: '',
          expectedRR: '',
          actualRR: '',
          pnl: -500,
          pnlPct: -1.5,
          status: 'Loss',
          emotionBefore: 'FOMO',
          emotionAfter: '',
          mistake: 'Entered without confirmation',
          disciplineScore: 4,
          notes: 'Entered too early. Ignored trend direction. Need confirmation next time.'
        }
      ],
      watchlist: ['TCS.NS', 'RELIANCE.NS', 'AAPL', 'NVDA'],
      realizedPnL: 0,
      portfolioHistory: [
        { time: '09:30', value: 1000000 },
        { time: '10:30', value: 1005000 },
        { time: '11:30', value: 1002000 },
        { time: '12:30', value: 1015000 },
        { time: '01:30', value: 1012000 },
        { time: '02:30', value: 1025000 },
        { time: '03:30', value: 1033133 },
      ],
      login: async (token, user) => {
        try {
          const headers = { 'Authorization': `Bearer ${token}` };
          
          // Fetch wallet
          const walletRes = await fetch('http://127.0.0.1:8000/wallet', { headers });
          const walletData = await walletRes.json();
          
          // Fetch trades
          const tradesRes = await fetch('http://127.0.0.1:8000/trades/history', { headers });
          const tradesData = await tradesRes.json();
          
          set({
            isAuthenticated: true,
            user,
            walletBalance: walletData.balance || 0,
            trades: tradesData.map((t: any) => ({
              id: String(t.id),
              symbol: t.symbol,
              type: t.type,
              quantity: t.quantity,
              price: t.price,
              time: t.time,
              status: t.status
            })),
            journalEntries: [], 
            portfolioHistory: []
          });
        } catch (err) {
          console.error("Failed to load user data", err);
          set({ isAuthenticated: true, user }); 
        }
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ 
          isAuthenticated: false, 
          user: null,
          trades: [],
          journalEntries: [],
          watchlist: [],
          walletBalance: 0,
          selectedStock: '',
          realizedPnL: 0,
          portfolioHistory: []
        });
      },
      setSelectedStock: (symbol) => set({ selectedStock: symbol }),
      setWalletBalance: (amount) => set({ walletBalance: amount }),
      resetWallet: (amount) => set({ walletBalance: amount ?? INITIAL_BALANCE }),
      toggleUserMode: () => set((state) => ({ userMode: state.userMode === 'Beginner' ? 'Professional' : 'Beginner' })),
      addTrade: (trade) => set((state) => ({
        trades: [
          {
            ...trade,
            id: Math.random().toString(36).substr(2, 9),
            time: new Date().toLocaleTimeString(),
            status: 'COMPLETED'
          },
          ...state.trades
        ]
      })),
      addJournalEntry: (entry) => set((state) => ({
        journalEntries: [
          { ...entry, id: Math.random().toString(36).substr(2, 9) },
          ...state.journalEntries
        ]
      })),
      updateJournalEntry: (id, entry) => set((state) => ({
        journalEntries: state.journalEntries.map(e => e.id === id ? { ...e, ...entry } : e)
      })),
      deleteJournalEntry: (id) => set((state) => ({
        journalEntries: state.journalEntries.filter(e => e.id !== id)
      })),
      clearHistory: () => set({ trades: [], realizedPnL: 0 }),
      toggleWatchlist: (symbol) => set((state) => ({
        watchlist: state.watchlist.includes(symbol)
          ? state.watchlist.filter(s => s !== symbol)
          : [...state.watchlist, symbol]
      })),
      resetAll: (amount) => set({
        trades: [],
        journalEntries: [],
        watchlist: [],
        walletBalance: amount ?? INITIAL_BALANCE,
        selectedStock: '',
        realizedPnL: 0
      }),
      addRealizedPnL: (amount) => set((state) => ({ realizedPnL: state.realizedPnL + amount })),
      toggleLearningMode: () => set((state) => ({ learningMode: !state.learningMode })),
    }),
    {
      name: 'paper-trading-storage', // name of the item in storage (must be unique)
    }
  )
);
