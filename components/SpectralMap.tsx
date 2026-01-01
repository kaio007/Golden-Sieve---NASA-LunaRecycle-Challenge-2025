import React, { useEffect, useRef, useState } from 'react';
import { COLORS, PHI } from '../constants';

interface SpectralMapProps {
  omega: number;
  v0: number;
}

const SpectralMap: React.FC<SpectralMapProps> = ({ omega, v0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [history, setHistory] = useState<number[][]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isStable = Math.abs(omega - PHI) < 0.02;
    const stabilityFactor = Math.max(0, 1 - Math.abs(omega - PHI) * 10);
    
    // Generate current spectral line snapshot
    const currentLine: number[] = [];
    const resolution = 120;
    for (let i = 0; i < resolution; i++) {
        const x = i / resolution;
        // Mock energy density based on phason drive resonance
        let signal = Math.abs(Math.cos(2 * Math.PI * PHI * x * 6 + omega * 3));
        if (!isStable) {
            // "Smearing" logic: Add noise to represent level repulsion/merging in ETH phase
            signal += Math.random() * (1 - stabilityFactor) * 2.5;
        }
        currentLine.push(signal);
    }

    setHistory(prev => [currentLine, ...prev].slice(0, 50));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      history.forEach((line, rowIdx) => {
        const y = (rowIdx / 50) * h;
        const barW = w / line.length;
        
        line.forEach((val, colIdx) => {
            const x = colIdx * barW;
            const rowOpacity = 1 - (rowIdx / 50);
            const intensity = Math.min(1, val * 0.9);
            
            ctx.globalAlpha = rowOpacity * intensity;
            ctx.fillStyle = isStable ? COLORS.EMERALD : COLORS.THERMAL;
            
            // Waterfall "Gap" visualization: Clearings in stable phase
            if (val > 0.5 && isStable) {
                ctx.fillStyle = COLORS.STABLE;
            } else if (val < 0.25) {
                ctx.globalAlpha = 0; // Represents the Spectral Gap
            }

            ctx.fillRect(x, y, barW + 1, h / 50 + 1);
        });
      });
      
      ctx.globalAlpha = 1;
    };

    draw();
  }, [omega, v0, history.length]);

  return (
    <div className="relative w-full h-56 bg-black border-2 border-white/10 overflow-hidden rounded-none shadow-2xl">
      <canvas ref={canvasRef} width={500} height={224} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />
      <div className="absolute top-4 left-6 text-[10px] text-slate-500 font-black uppercase tracking-[0.8em]">Spectral Sonar Waterfall</div>
      <div className={`absolute bottom-4 right-6 text-[9px] font-bold uppercase tracking-widest border px-6 py-2 bg-black/95 transition-all duration-500 ${Math.abs(omega - PHI) < 0.02 ? 'text-emerald-400 border-emerald-400 shadow-[0_0_20px_#10b98144]' : 'text-orange-500 border-orange-500'}`}>
        {Math.abs(omega - PHI) < 0.02 ? 'GAPS: OPEN_MBL' : 'GAPS: SMEARED_ETH'}
      </div>
    </div>
  );
};

export default SpectralMap;