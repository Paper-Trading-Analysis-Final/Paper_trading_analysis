import React, { useState } from 'react';
import { BookOpen, Target, CheckCircle2, AlertTriangle, Lightbulb, Play, Layers, TrendingUp, ArrowRight } from 'lucide-react';

// --- Types & Data ---

type Frequency = 'All' | 'Most Common' | 'Moderate' | 'Rare';

interface Pattern {
  name: string;
  type: string;
  frequency: Frequency;
  story: string;
  playbook: string;
  renderCandle: () => React.ReactNode;
}

const PATTERNS: Pattern[] = [
  {
    name: 'Hammer',
    type: 'Bullish Reversal',
    frequency: 'Most Common',
    story: 'Sellers pushed the price down significantly during the session, but strong buying pressure stepped in to drive it back up, closing near the open. Shows a rejection of lower prices.',
    playbook: 'Wait for the next candle to break above the Hammer\'s high. Place Stop Loss immediately below the Hammer\'s wick low. Target 1:2 Risk/Reward.',
    renderCandle: () => (
      <div className="flex justify-center items-end h-full py-4 group relative cursor-pointer">
        {/* Tooltip */}
        <div className="absolute -top-10 bg-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border border-gray-700">
          Open: 100, Close: 105<br />High: 106, Low: 80
        </div>
        {/* Wick */}
        <div className="absolute w-1 bg-gray-500 h-24 bottom-4"></div>
        {/* Body */}
        <div className="absolute w-6 bg-success h-6 bottom-20 rounded-sm shadow-[0_0_10px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-shadow"></div>
      </div>
    )
  },
  {
    name: 'Engulfing (Bullish)',
    type: 'Strong Reversal',
    frequency: 'Most Common',
    story: 'A small red candle is completely "engulfed" by the next large green candle. The buyers have taken complete control over the sellers in a single forceful move.',
    playbook: 'Enter at the close of the engulfing green candle if at a support level. Stop Loss below the engulfing candle low.',
    renderCandle: () => (
      <div className="flex justify-center items-end h-full py-4 space-x-2 group relative cursor-pointer">
        {/* Candle 1 (Bearish) */}
        <div className="relative flex justify-center w-6 h-16 bottom-4">
          <div className="absolute w-1 bg-gray-500 h-16"></div>
          <div className="absolute w-5 bg-danger h-8 top-4 rounded-sm"></div>
        </div>
        {/* Candle 2 (Bullish Engulfing) */}
        <div className="relative flex justify-center w-6 h-24 bottom-2">
          <div className="absolute w-1 bg-gray-500 h-24"></div>
          <div className="absolute w-6 bg-success h-20 top-2 rounded-sm shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
        </div>
      </div>
    )
  },
  {
    name: 'Doji',
    type: 'Indecision',
    frequency: 'Most Common',
    story: 'Price opened and closed at almost the exact same level. A fierce battle between buyers and sellers resulted in a tie. Indicates a potential turning point.',
    playbook: 'Do not trade the Doji itself. Wait for the next candle to break the Doji\'s high (Buy) or low (Sell).',
    renderCandle: () => (
      <div className="flex justify-center items-center h-full py-4 group relative cursor-pointer">
        <div className="absolute w-1 bg-gray-500 h-20"></div>
        <div className="absolute w-6 bg-gray-300 h-1 rounded-sm shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
      </div>
    )
  },
  {
    name: 'Shooting Star',
    type: 'Bearish Reversal',
    frequency: 'Moderate',
    story: 'Buyers pushed the price up aggressively, but sellers crashed the party and drove the price all the way back down. A strong rejection of higher prices.',
    playbook: 'Enter short at the open of the next candle if the trend was upward. SL right at the wick\'s peak.',
    renderCandle: () => (
      <div className="flex justify-center items-start h-full py-4 group relative cursor-pointer">
        <div className="absolute w-1 bg-gray-500 h-24 top-4"></div>
        <div className="absolute w-6 bg-danger h-6 top-20 rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.3)]"></div>
      </div>
    )
  },
  {
    name: 'Three White Soldiers',
    type: 'Strong Trend',
    frequency: 'Rare',
    story: 'Three consecutive long green candles with higher closes. Bears are completely exhausted, and bulls are marching steadily forward.',
    playbook: 'Wait for a minor pullback to the body of the second soldier to enter long. Avoid buying at the very top of the third candle due to short-term overextension.',
    renderCandle: () => (
      <div className="flex justify-center items-end h-full py-4 space-x-1 group relative cursor-pointer">
        <div className="relative flex justify-center w-4 h-12 bottom-0"><div className="absolute w-4 bg-success h-10 bottom-1 rounded-sm"></div></div>
        <div className="relative flex justify-center w-4 h-16 bottom-6"><div className="absolute w-4 bg-success h-14 bottom-1 rounded-sm"></div></div>
        <div className="relative flex justify-center w-4 h-20 bottom-14"><div className="absolute w-4 bg-success h-18 bottom-1 rounded-sm shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div></div>
      </div>
    )
  }
];

export default function LearningHub() {
  const [filter, setFilter] = useState<Frequency>('All');
  const [sandboxOverlay, setSandboxOverlay] = useState<'none' | 'entry' | 'stop' | 'target'>('none');

  const filteredPatterns = PATTERNS.filter(p => filter === 'All' || p.frequency === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-[#070a13] border border-blue-500/20 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="text-accent w-8 h-8" />
            <h1 className="text-4xl font-black text-white tracking-tight">Trader Pro Academy</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed mb-6">
            Welcome to the ultimate mastery hub. Step away from the noise of live markets and focus on pure price action. Learn the patterns, understand the psychology, and build a bulletproof trading playbook.
          </p>
          <div className="flex items-center space-x-4 bg-black/40 w-max px-4 py-2 rounded-full border border-white/5">
            <Target className="w-5 h-5 text-success" />
            <span className="text-sm font-bold text-gray-200">Current Progress: <span className="text-white">0 / 12 Mastered</span></span>
          </div>
        </div>
      </div>

      {/* Candlestick Patterns Module */}
      <section id="candlesticks">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Layers className="w-6 h-6 mr-3 text-accent" />
            Candlestick Anatomy & Patterns
          </h2>
          <div className="flex bg-panel border border-border rounded-xl p-1">
            {(['All', 'Most Common', 'Moderate', 'Rare'] as Frequency[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatterns.map(pattern => (
            <div key={pattern.name} className="bg-panel border border-border rounded-2xl p-6 hover:border-accent/40 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{pattern.name}</h3>
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-md uppercase tracking-wider">{pattern.type}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold border border-gray-700 px-2 py-0.5 rounded">{pattern.frequency}</span>
              </div>

              <div className="h-32 bg-[#0a0e17] rounded-xl border border-border/50 mb-4 flex items-center justify-center overflow-hidden">
                {pattern.renderCandle()}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center"><Lightbulb className="w-3 h-3 mr-1" /> The Story</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{pattern.story}</p>
                </div>
                <div className="bg-accent/5 border border-accent/10 p-3 rounded-xl">
                  <h4 className="text-xs text-accent font-bold uppercase mb-1 flex items-center"><Play className="w-3 h-3 mr-1" /> Playbook Rule</h4>
                  <p className="text-sm text-gray-300">{pattern.playbook}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* S&R and Playbook row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section id="snr" className="bg-panel border border-border rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white flex items-center mb-6">
            <TrendingUp className="w-6 h-6 mr-3 text-warning" />
            Support & Resistance
          </h2>
          <div className="space-y-6">
            <div className="border-l-2 border-success pl-4">
              <h3 className="font-bold text-white mb-1">Support (Demand Zone)</h3>
              <p className="text-sm text-gray-400">A floor where buying interest is strong enough to overcome selling pressure. Price bounces up.</p>
            </div>
            <div className="border-l-2 border-danger pl-4">
              <h3 className="font-bold text-white mb-1">Resistance (Supply Zone)</h3>
              <p className="text-sm text-gray-400">A ceiling where selling pressure overcomes buying pressure. Price gets rejected downwards.</p>
            </div>
            <div className="border-l-2 border-accent pl-4">
              <h3 className="font-bold text-white mb-1">The Rule of Polarity</h3>
              <p className="text-sm text-gray-400">When Resistance is broken, it becomes new Support. When Support is broken, it turns into Resistance.</p>
            </div>
          </div>
        </section>

        <section id="playbook" className="bg-panel border border-border rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white flex items-center mb-6">
            <CheckCircle2 className="w-6 h-6 mr-3 text-success" />
            The Triple Confirmation Rule
          </h2>
          <p className="text-sm text-gray-400 mb-6">Never enter a trade blindly. Wait for these three conditions to align before clicking buy or sell.</p>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mt-0.5 mr-3 shrink-0">1</div>
              <div>
                <strong className="text-white text-sm block">Location is Everything</strong>
                <span className="text-sm text-gray-500">Price must be at a key Support, Resistance, or Trendline.</span>
              </div>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mt-0.5 mr-3 shrink-0">2</div>
              <div>
                <strong className="text-white text-sm block">Pattern Trigger</strong>
                <span className="text-sm text-gray-500">A clear reversal or continuation candlestick pattern must form (e.g., Hammer).</span>
              </div>
            </li>
            <li className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mt-0.5 mr-3 shrink-0">3</div>
              <div>
                <strong className="text-white text-sm block">Volume & Confirmation</strong>
                <span className="text-sm text-gray-500">The breakout candle must have higher volume. Don't anticipate, wait for the close.</span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      {/* Interactive Sandbox */}
      <section id="sandbox" className="bg-[#070a13] border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-10">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">Interactive Setup Sandbox</h2>
            <p className="text-gray-400 mb-8">Click the buttons to see how a professional maps out a trade based on a Hammer rejection at support.</p>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setSandboxOverlay('entry')}
                className={`px-6 py-3 rounded-xl font-bold text-left transition-all flex items-center justify-between ${sandboxOverlay === 'entry' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-panel text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>1. Identify Optimal Entry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSandboxOverlay('stop')}
                className={`px-6 py-3 rounded-xl font-bold text-left transition-all flex items-center justify-between ${sandboxOverlay === 'stop' ? 'bg-danger text-white shadow-lg shadow-danger/20' : 'bg-panel text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>2. Place Stop Loss (Risk)</span>
                <AlertTriangle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSandboxOverlay('target')}
                className={`px-6 py-3 rounded-xl font-bold text-left transition-all flex items-center justify-between ${sandboxOverlay === 'target' ? 'bg-success text-white shadow-lg shadow-success/20' : 'bg-panel text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>3. Set Take Profit (Reward)</span>
                <Target className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSandboxOverlay('none')}
                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-white text-center mt-4"
              >
                Reset Chart
              </button>
            </div>
          </div>

          <div className="flex-1 bg-panel/50 backdrop-blur-sm border border-border rounded-2xl h-80 relative flex items-end px-10 pb-10 justify-center">
            {/* Support Line */}
            <div className="absolute bottom-16 left-0 right-0 border-b-2 border-dashed border-gray-500 flex items-end">
              <span className="text-[10px] text-gray-500 ml-2 mb-1">MAJOR SUPPORT</span>
            </div>

            {/* Candles */}
            <div className="flex items-end space-x-6 z-10">
              {/* Bearish move down */}
              <div className="relative flex justify-center w-6 h-32 bottom-20"><div className="absolute w-1 bg-gray-600 h-32"></div><div className="absolute w-6 bg-danger h-24 top-4 rounded-sm"></div></div>
              <div className="relative flex justify-center w-6 h-24 bottom-12"><div className="absolute w-1 bg-gray-600 h-24"></div><div className="absolute w-6 bg-danger h-16 top-4 rounded-sm"></div></div>

              {/* The Hammer on Support */}
              <div className="relative flex justify-center w-6 h-20 bottom-4 group">
                <div className="absolute w-1 bg-gray-400 h-20"></div>
                <div className="absolute w-6 bg-success h-6 top-0 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.4)]"></div>
              </div>

              {/* The Entry Candle (Hidden unless entry clicked) */}
              <div className={`relative flex justify-center w-6 h-28 bottom-10 transition-opacity duration-500 ${['entry', 'target'].includes(sandboxOverlay) ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute w-1 bg-gray-400 h-28"></div>
                <div className="absolute w-6 bg-success h-20 top-4 rounded-sm"></div>
              </div>
            </div>

            {/* Overlays */}
            {sandboxOverlay === 'entry' && (
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-accent/10 z-0 flex items-center justify-center animate-in fade-in">
                <div className="absolute top-[40%] w-full border-t-2 border-accent">
                  <span className="bg-accent text-white text-xs font-bold px-2 py-1 absolute -top-3 left-4 rounded">ENTRY LINE</span>
                </div>
              </div>
            )}
            {sandboxOverlay === 'stop' && (
              <div className="absolute bottom-0 h-12 w-full bg-danger/10 z-0 flex items-start justify-center animate-in fade-in border-t-2 border-danger">
                <span className="bg-danger text-white text-xs font-bold px-2 py-1 absolute -top-3 left-4 rounded">STOP LOSS</span>
              </div>
            )}
            {sandboxOverlay === 'target' && (
              <div className="absolute top-0 h-32 w-full bg-success/10 z-0 flex items-end justify-center animate-in fade-in border-b-2 border-success">
                <span className="bg-success text-white text-xs font-bold px-2 py-1 absolute -bottom-3 left-4 rounded">TAKE PROFIT (1:2)</span>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
