import React, { useState, useEffect } from 'react';
import { SimulationState } from '../types';
import { PHI, JITTER_THRESHOLD } from '../constants';

/**
 * WHERE: src/components/AuditLog.tsx
 * WHAT: Process Evolution Timeline.
 * HOW: Maps real-time state transitions to verifiable history steps.
 * WHY: Integrated into the sidebar for unified Command Module monitoring.
 */

interface AuditLogProps {
  state: SimulationState;
  time: number;
}

const AuditLog: React.FC<AuditLogProps> = ({ state, time }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const itv = setInterval(() => {
      const t_ms = (time * 100).toFixed(0);
      let message = "";

      const detuning = Math.abs(state.omega - PHI);
      const isHeating = state.jitter > JITTER_THRESHOLD || detuning > 0.08;

      if (state.isRadiationBurst) {
        message = `[${t_ms}ms] CRITICAL: RADIATION_ANOMALY DETECTED. Shield flux active.`;
      } else if (isHeating) {
        message = `[${t_ms}ms] ERROR: PHASE_FRAGMENTATION. Ergodic heating loss.`;
      } else if (state.jitter > 30 || detuning > 0.02) {
        message = `[${t_ms}ms] WARN: SYNC_SIEVING. Active phason correction.`;
      } else if (state.viewMode === '4D') {
        message = `[${t_ms}ms] INFO: TOPOLOGICAL_LOCK. 4D Extrusion engaged.`;
      } else {
        message = `[${t_ms}ms] OK: RECONSTRUCTION_VERIFIED. MBL lock holding.`;
      }

      setLogs(prev => [message, ...prev].slice(0, 5));
    }, 1200);

    return () => clearInterval(itv);
  }, [state.U, state.omega, state.jitter, state.isRadiationBurst, state.viewMode, time]);

  return (
    <div className="w-full">
       <div className="glass p-8 border-l-4 border-cyan-400 bg-black/60 shadow-2xl">
          <div className="flex items-center gap-6 mb-6">
             <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
             <h4 className="text-[12px] font-black uppercase tracking-[1em] text-cyan-400">Process Evolution Timeline</h4>
          </div>
          <div className="space-y-4">
             {logs.map((log, i) => {
                const isCurrent = i === 0;
                return (
                  <div key={i} className={`flex gap-5 items-center transition-all duration-700 ${isCurrent ? 'opacity-100 scale-100' : 'opacity-20 scale-95 translate-x-2'}`}>
                    <div className={`w-1.5 h-1.5 shrink-0 rotate-45 border border-white ${isCurrent ? 'bg-cyan-400 shadow-[0_0_15px_cyan]' : 'bg-transparent'}`} />
                    <span className={`font-mono text-[11px] uppercase tracking-[0.2em] leading-none ${isCurrent ? 'text-white font-bold' : 'text-slate-600'}`}>
                      {log}
                    </span>
                  </div>
                );
             })}
          </div>
          <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center opacity-30">
              <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest">Live Stream Encrypted</span>
              <span className="text-[8px] font-mono text-slate-500">RESIL: {(state.chronosValue * 100).toFixed(1)}%</span>
          </div>
       </div>
    </div>
  );
};

export default AuditLog;
