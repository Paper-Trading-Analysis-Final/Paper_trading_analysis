import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { ZoomIn, ZoomOut, Hand, Maximize, AlertCircle, Loader2 } from 'lucide-react';

interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartProps {
  timeframe: string;
}

const TradingViewChart: React.FC<ChartProps> = ({ timeframe }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedStock = useStore((state) => state.selectedStock);
  const [data, setData] = useState<OHLCData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isPanMode, setIsPanMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const fetchChartData = useCallback(async () => {
    if (!selectedStock) return;
    setLoading(true);
    setError(null);
    try {
      const formattedPeriod = timeframe.toLowerCase();
      const response = await fetch(`http://127.0.0.1:8000/chart?symbol=${encodeURIComponent(selectedStock)}&period=${formattedPeriod}`);
      if (!response.ok) throw new Error(`Backend Error: ${response.status}`);
      const result = await response.json();
      
      if (result.success === false || result.error) {
        throw new Error(result.error || "Unable to fetch chart data");
      }
      
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
      } else {
        setData([]);
        setError("No historical data available for this period.");
      }
    } catch (err: any) {
      console.error("Failed to fetch chart data:", err);
      setError(err.message || "Failed to load chart data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStock, timeframe]);

  useEffect(() => {
    fetchChartData();
    
    let interval: any;
    if (timeframe === '1D') {
      interval = setInterval(fetchChartData, 60000);
    }
    
    setPan(0);
    setZoom(1);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchChartData, timeframe]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    // Clear entire canvas using raw dimensions
    ctx.clearRect(0, 0, width, height);
    
    if (data.length === 0) return;

    const paddingRight = 60;
    const paddingBottom = 40;
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingBottom;
    
    const maxPrice = Math.max(...data.map(d => d.high)) * 1.002;
    const minPrice = Math.min(...data.map(d => d.low)) * 0.998;
    const priceRange = maxPrice - minPrice || 1;
    
    const baseSpacing = (chartWidth / data.length);
    const spacing = baseSpacing * zoom;
    const candleWidth = Math.max(spacing * 0.7, 1);

    // 1. Draw Grid Lines
    ctx.strokeStyle = '#1a2235';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const numGridLines = 6;
    for(let i=0; i<=numGridLines; i++) {
        const price = minPrice + (priceRange / numGridLines) * i;
        const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        if (y >= 0 && y <= chartHeight) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(chartWidth, y);
            ctx.stroke();
            ctx.fillText(price.toFixed(2), chartWidth + 10, y);
        }
    }

    // 2. Draw X Axis
    ctx.textAlign = 'center';
    const step = Math.max(Math.floor(data.length / 5), 1);
    data.forEach((d, i) => {
      if (i % step === 0) {
        const x = (i * spacing) + pan + (spacing / 2);
        if (x > 0 && x < chartWidth) {
          const dateObj = new Date(d.time);
          const label = timeframe === '1D' 
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          
          ctx.fillText(label, x, chartHeight + 20);
        }
      }
    });

    // 3. Draw Candles
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, chartWidth, chartHeight);
    ctx.clip();
    
    ctx.translate(pan, 0);

    data.forEach((d, i) => {
      const x = i * spacing + (spacing / 2);
      
      const openY = chartHeight - ((d.open - minPrice) / priceRange) * chartHeight;
      const closeY = chartHeight - ((d.close - minPrice) / priceRange) * chartHeight;
      const highY = chartHeight - ((d.high - minPrice) / priceRange) * chartHeight;
      const lowY = chartHeight - ((d.low - minPrice) / priceRange) * chartHeight;
      
      const isUp = d.close >= d.open;
      const color = isUp ? '#10b981' : '#ef4444';

      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = color;
      const bodyY = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(closeY - openY), 1);
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyH);
    });

    ctx.restore();

    // 4. Current Price Line
    const currentPrice = data[data.length - 1].close;
    const currentY = chartHeight - ((currentPrice - minPrice) / priceRange) * chartHeight;
    
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(chartWidth, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(chartWidth, currentY - 10, 60, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Inter"';
    ctx.textAlign = 'center';
    ctx.fillText(currentPrice.toFixed(2), chartWidth + 30, currentY);

  }, [data, zoom, pan, timeframe]);

  useEffect(() => {
    drawChart();
    window.addEventListener('resize', drawChart);
    return () => window.removeEventListener('resize', drawChart);
  }, [drawChart]);

  // Manually attach wheel event for non-passive behavior
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelManual = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom(z => Math.min(z * 1.1, 10));
      } else {
        setZoom(z => Math.max(z / 1.1, 0.5));
      }
    };

    canvas.addEventListener('wheel', handleWheelManual, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheelManual);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPanMode) return;
    setIsDragging(true);
    setStartX(e.clientX - pan);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isPanMode) return;
    setPan(e.clientX - startX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative group bg-panel/30 rounded-xl border border-border overflow-hidden">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Fetching Market Data...</span>
        </div>
      )}

      {/* Error Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm p-6 text-center">
          <AlertCircle className="w-12 h-12 text-danger mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Chart Error</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">{error}</p>
          <button onClick={fetchChartData} className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Empty State */}
      {!selectedStock && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
          <Maximize className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">Select a stock to view its performance</p>
        </div>
      )}

      {/* Chart Action Toolbar */}
      <div className="absolute top-4 right-16 z-20 flex space-x-1 bg-panel/80 backdrop-blur-md border border-border rounded-lg p-1 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <button onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(z => Math.min(z * 1.2, 10))} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px bg-border my-1 mx-1"></div>
        <button 
          onClick={() => setIsPanMode(!isPanMode)} 
          className={`p-1.5 rounded transition-all ${isPanMode ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          title={isPanMode ? "Switch to Select" : "Switch to Pan"}
        >
          <Hand className="w-4 h-4" />
        </button>
        <button onClick={() => { setZoom(1); setPan(0); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Reset View">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className={`w-full h-full absolute inset-0 ${isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
        style={{ display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default TradingViewChart;
