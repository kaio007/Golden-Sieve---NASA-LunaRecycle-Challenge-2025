export interface SimulationState {
  U: number; // Interaction strength
  V0: number; // Potential depth
  jitter: number; // Timing jitter (ps)
  omega: number; // Drive frequency
  showTechOverlay: boolean;
  showUnderTheHood: boolean;
  isRadiationBurst: boolean;
  isHeating: boolean; // Derived state for visual feedback
  isBooting: boolean; // Cold boot sequence active
  bootProgress: number; // 0 to 1
  entropyWaveTime: number | null; 
  entropyWaveOrigin: { x: number, y: number } | null;
  selectedSiteId: number | null; 
  hoveredSiteId: number | null; 
  hoveredComposition: { al: number, cu: number, fe: number } | null;
  isAutoProcess: boolean; 
  isNarrativeMode: boolean; // Presentation mode toggle
  missionStep: string; 
  viewMode: 'NORMAL' | 'COMPARISON' | '4D'; 
  focusMode: 'OPERATIONAL' | 'ANALYSIS' | 'PHYSICS'; 
  levelSpacing: number[]; 
  entanglementEntropy: number; 
  chronosValue: number; 
  currentStage: 'SPLITTING' | 'FILTERING' | 'RECONSTRUCTION';
  materialPhase: number; 
  sievingWaveProgress: number; 
  avalancheWaveProgress: number; // X-coordinate of the traveling avalanche wave
  flareExcitation: number; // 0 to 1 decay for solar flare recovery
}

export interface LatticeSite {
  id: number;
  x: number;
  y: number;
  v: number; 
  amplitude: number; 
  phase: number;
  ipr: number; 
  lyapunov: number; 
  isRandom?: boolean; 
}

export interface MSDPoint {
  time: number;
  msd: number;
  ansatz: number;
}