import React from 'react';

const News = () => {
  const newsItems = [
    {
      id: 1,
      title: 'Reliance Industries signs major energy deal',
      summary: 'Reliance has partnered with a global energy consortium to expand its renewable footprint across Asia over the next decade.',
      source: 'Financial Times',
      symbols: ['RELIANCE.NS'],
      sentiment: 'BULLISH',
    },
    {
      id: 2,
      title: 'Tech sector faces headwinds amid global chip shortage',
      summary: 'Major IT firms including TCS and Infosys report cautious guidance for the upcoming quarter due to hardware constraints.',
      source: 'Bloomberg',
      symbols: ['TCS.NS', 'INFY.NS'],
      sentiment: 'BEARISH',
    },
    {
      id: 3,
      title: 'HDFC Bank maintains steady growth in Q3',
      summary: 'HDFC Bank posted inline earnings with stable asset quality, meeting street expectations.',
      source: 'Reuters',
      symbols: ['HDFCBANK.NS'],
      sentiment: 'NEUTRAL',
    },
  ];

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH':
        return <span className="px-2 py-1 bg-success/20 text-success border border-success/30 rounded text-xs font-bold">BULLISH</span>;
      case 'BEARISH':
        return <span className="px-2 py-1 bg-danger/20 text-danger border border-danger/30 rounded text-xs font-bold">BEARISH</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded text-xs font-bold">NEUTRAL</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-accent">Market News</h2>
      <div className="space-y-4">
        {newsItems.map((news) => (
          <div key={news.id} className="bg-panel p-5 rounded border border-accent/20 hover:border-accent/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-text">{news.title}</h3>
              {getSentimentBadge(news.sentiment)}
            </div>
            <p className="text-muted text-sm mb-4 leading-relaxed">{news.summary}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-accent">{news.source}</span>
              <div className="flex gap-2">
                {news.symbols.map(sym => (
                  <span key={sym} className="px-2 py-1 bg-background rounded text-muted border border-accent/10">{sym}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
