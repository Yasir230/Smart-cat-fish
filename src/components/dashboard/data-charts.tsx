'use client';

import { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { HistoryEntry } from '@/types';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { cn, formatTimestamp } from '@/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

interface DataChartsProps {
  history: HistoryEntry[];
  isLoading: boolean;
}

export function DataCharts({ history, isLoading }: DataChartsProps) {
  const [activeTab, setActiveTab] = useState<'do' | 'temp'>('do');

  if (isLoading) {
    return (
      <GlassPanel title="Data Historis" icon={BarChart2} className="md:col-span-2">
        <div className="flex flex-col h-[300px] gap-4">
          <SkeletonLoader className="w-full h-10 rounded-lg" />
          <SkeletonLoader className="w-full flex-1 rounded-xl" />
        </div>
      </GlassPanel>
    );
  }

  // Format data for Recharts
  const chartData = history.map(h => ({
    time: formatTimestamp(h.timestamp).substring(0, 5),
    fullTime: formatTimestamp(h.timestamp),
    doValue: h.doPredicted,
    temp: h.suhu,
    risk: h.doRisk
  }));

  // Custom Glass Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0c4a6e]/90 backdrop-blur-xl border border-sky-500/30 p-3 rounded-xl shadow-xl">
          <p className="text-white/60 text-xs mb-2 font-mono">{payload[0].payload.fullTime}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-white text-sm font-medium">
                {entry.name}: <span className="font-bold">{entry.value.toFixed(1)}</span>
                {entry.name === 'DO Level' ? ' mg/L' : ' °C'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['Waktu', 'DO (mg/L)', 'Suhu (C)', 'Level Air (%)', 'Intensitas Cahaya (%)', 'Risk Score', 'Aerator'];
    const csvContent = [
      headers.join(','),
      ...history.map(h => [
        h.timestamp,
        h.doPredicted.toFixed(2),
        h.suhu.toFixed(1),
        h.waterPct,
        h.ldrPct,
        h.doRisk,
        h.aeratorOn ? 'ON' : 'OFF'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `catfish_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <GlassPanel 
      title="Grafik Data Pemantauan" 
      icon={BarChart2} 
      className="md:col-span-2"
      headerAction={
        <button 
          onClick={handleExportCSV}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white py-1.5 px-3 rounded-lg transition-colors font-medium"
        >
          Export CSV
        </button>
      }
    >
      <div className="flex flex-col h-[350px]">
        
        {/* Tabs */}
        <div className="flex p-1 bg-black/20 rounded-lg w-fit border border-white/5 mb-6">
          <button
            onClick={() => setActiveTab('do')}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300",
              activeTab === 'do' ? "bg-sky-500 text-white shadow-lg" : "text-white/50 hover:text-white"
            )}
          >
            Tingkat DO (Area)
          </button>
          <button
            onClick={() => setActiveTab('temp')}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300",
              activeTab === 'temp' ? "bg-purple-500 text-white shadow-lg" : "text-white/50 hover:text-white"
            )}
          >
            Korelasi Suhu (Scatter)
          </button>
        </div>

        {/* Charts Container */}
        <div className="flex-1 w-full relative">
          
          {chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              <BarChart2 className="w-8 h-8 opacity-50 mb-2" />
              <p className="text-sm">Belum ada data riwayat untuk ditampilkan</p>
            </div>
          ) : activeTab === 'do' ? (
            /* Area Chart for DO */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickMargin={10}
                  tickFormatter={(val, i) => i % 5 === 0 ? val : ''} // Decimate ticks if too many
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  domain={[0, 10]} 
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="doValue" 
                  name="DO Level" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorDO)" 
                  isAnimationActive={true}
                  animationDuration={1500}
                />
                {/* Critical Threshold Line */}
                <Area 
                  type="step" 
                  dataKey={() => 3} 
                  stroke="rgba(239,68,68,0.5)" 
                  strokeWidth={1} 
                  strokeDasharray="5 5" 
                  fill="none" 
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            /* Scatter Chart for DO vs Temp */
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" 
                  dataKey="temp" 
                  name="Suhu" 
                  unit="°C" 
                  domain={['auto', 'auto']}
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12}
                >
                  <text x={200} y={40} fill="rgba(255,255,255,0.5)" fontSize={12} textAnchor="middle">Suhu Air (°C)</text>
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="doValue" 
                  name="DO Level" 
                  unit=" mg/L" 
                  domain={[0, 10]}
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12}
                />
                <ZAxis type="number" range={[50, 50]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: 'rgba(30, 27, 75, 0.9)', borderColor: 'rgba(168, 85, 247, 0.3)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Scatter 
                  name="DO vs Suhu" 
                  data={chartData} 
                  fill="#a855f7" 
                  opacity={0.7}
                  isAnimationActive={true}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}

        </div>
      </div>
    </GlassPanel>
  );
}
