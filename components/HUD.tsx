import React from 'react';
import { SimulationState } from '../types';
import { PHI, JITTER_THRESHOLD } from '../constants';

interface HUDProps {
  state: SimulationState;
  onUpdateState: (updates: Partial<SimulationState>) => void;
}

const HUD: React.FC<HUDProps> = ({ state, onUpdateState }) => {
  const getMissionStatus = () => {
    const detuning = Math.abs(state.omega - PHI);
    
    if (state.isRadiationBurst) {
      return { 
        label: 'WARNING: FLARE_IMPACT', 
        sub: 'Shielding flux active...', 
        color: 'text-orange-500', 
        border: 'border-orange-500', 
        glow: 'shadow-[0_0_100px_rgba(249,115,22,0.6)]' 
      };
    }

    if (state.isAutoProcess) {
      return { 
        label: 'STATUS: AUTO_SEQUENCE', 
        sub: state.missionStep.replace(/_/g, ' '), 
        color: 'text-cyan-400', 
        border: 'border-cyan-400', 
        glow: 'shadow-[0_0_60px_rgba(34,211,238,0.4)]' 
      };
    }
    
    if (state.jitter > JITTER_THRESHOLD) return { label: 'DANGER: EVAPORATION', sub: 'Information loss detected.', color: 'text-red-500', border: 'border-red-500/40', glow: 'shadow-[0_0_50px_rgba(239,68,68,0.3)]' };
    if (detuning > 0.08) return { label: 'CRITICAL: DRIVE_DRIFT', sub: 'Drive causing thermal leakage.', color: 'text-red-400', border: 'border-red-400/40', glow: 'shadow-[0_0_50px_rgba(248,113,113,0.3)]' };
    
    return { label: 'STATUS: MISSION_LOCK', sub: 'Topological protection active.', color: 'text-[#00F2FF]', border: 'border-[#00F2FF]/40', glow: 'shadow-[0_0_50px_rgba(0,242,255,0.3)]' };
  };

  const status = getMissionStatus();

  return (
    <div className="absolute top-0 left-0 p-4 lg:p-10 pointer-events-none w-full flex flex-col gap-4 lg:gap-8 z-[100] select-none">
      <div className="flex flex-col lg:flex-row items-start justify-between w-full gap-4 lg:gap-6">
        <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-8 w-full lg:w-auto">
          {/* Tab Selection */}
          <div className="glass p-2 lg:p-5 pointer-events-auto border-2 border-white/10 bg-black/98 shadow-2xl shrink-0">
             <div className="flex gap-1.5 lg:gap-3">
               {['OPERATIONAL', 'ANALYSIS', 'PHYSICS'].map((mode) => (
                 <button
                   key={mode}
                   onClick={() => onUpdateState({ focusMode: mode as any })}
                   className={`px-3 lg:px-8 py-2 lg:py-4 text-[8px] lg:text-[11px] font-black uppercase tracking-[0.1em] lg:tracking-[0.4em] transition-all border-2 
                     ${state.focusMode === mode ? 'bg-[#00F2FF] text-black border-white shadow-[0_0_30px_#00F2FF]' : 'text-slate-500 border-transparent hover:border-white/20 hover:text-white'}`}
                 >
                   {mode}
                 </button>
               ))}
             </div>
          </div>

          {/* Status Box */}
          <div className={`glass p-3 lg:p-8 border-2 lg:border-4 ${status.border} ${status.glow} bg-black/98 shadow-2xl transition-all duration-500 pointer-events-auto min-w-0 lg:min-w-[500px] shrink-0`}>
              <div className="flex items-center gap-3 lg:gap-8">
                  <div className={`w-6 h-6 lg:w-12 lg:h-12 ${status.color.replace('text', 'bg')} ${state.isAutoProcess ? 'animate-spin' : 'animate-pulse'} shrink-0 shadow-[0_0_25px_currentColor]`} />
                  <div className="flex flex-col overflow-hidden">
                      <h2 className={`text-sm lg:text-4xl font-black tracking-tighter uppercase ${status.color} leading-none truncate`}>{status.label}</h2>
                      <p className="text-[7px] lg:text-[11px] text-slate-400 uppercase tracking-[0.2em] lg:tracking-[0.5em] mt-1 lg:mt-5 font-black leading-none truncate">{status.sub}</p>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;