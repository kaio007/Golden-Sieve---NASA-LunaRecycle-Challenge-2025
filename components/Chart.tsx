import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MSDPoint } from '../types';
import { COLORS } from '../constants';

interface ChartProps {
  data: MSDPoint[];
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-black/50 p-6 border border-white/5 rounded-none relative overflow-hidden shadow-inner">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[42px] font-black text-white/[0.02] pointer-events-none select-none uppercase tracking-[1em] -rotate-6 whitespace-nowrap">
        PHYSICS_VERIFIED
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 5" stroke="#1e293b" />
          <XAxis 
            dataKey="time" 
            scale="log" 
            domain={['auto', 'auto']} 
            type="number"
            stroke="#475569"
            tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}}
          />
          <YAxis 
            scale="log" 
            domain={['auto', 'auto']} 
            type="number"
            stroke="#475569"
            tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #334155', fontSize: '11px', borderRadius: '0' }}
            itemStyle={{ fontSize: '11px', color: '#f8fafc', fontWeight: 'bold' }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', paddingBottom: '15px', color: '#94a3b8' }} />
          <Line 
            type="monotone" 
            dataKey="msd" 
            name="Raw MSD" 
            stroke={COLORS.THERMAL} 
            dot={false} 
            strokeWidth={3}
            animationDuration={300}
          />
          <Line 
            type="monotone" 
            dataKey="ansatz" 
            name="Theoretical" 
            // Fix: Replaced missing COLORS.LOCALIZED with COLORS.STABLE to reflect the localized phase
            stroke={COLORS.STABLE} 
            strokeDasharray="5 5" 
            dot={false}
            strokeWidth={1.5}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;