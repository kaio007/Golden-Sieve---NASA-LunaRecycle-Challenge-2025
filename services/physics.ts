/**
 * WHERE: src/services/physics.ts
 * WHAT: Physics Engine (Layer A). Manages phase transition math and L-Bit properties.
 * HOW: Implements AAH potential with dynamic localization length calculations.
 * WHY: To provide the mathematical basis for the "Splitting" and "Reconstruction" animations.
 */

import { LatticeSite, SimulationState } from '../types';
import { GRID_SIZE, PHI, JITTER_THRESHOLD, PHYSICS_CONFIG } from '../constants';

export const validateJitterBudget = (jitter: number): boolean => jitter <= JITTER_THRESHOLD;

/**
 * WHERE: Context - [The Sieve]
 * WHAT: Generates 2D Quasiperiodic Potential mapping.
 * HOW: V_ij = V0 * [cos(2pi*phi*i) + cos(2pi*phi*j)].
 * WHY: Creates the deterministic energy landscape that enables MBL.
 */
export const generateLattice = (V0: number, isRandom: boolean = false): LatticeSite[] => {
  const lattice: LatticeSite[] = [];
  const STRICT_PHI = 1.6180339887; 
  
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const x_coord = i - GRID_SIZE / 2;
      const y_coord = j - GRID_SIZE / 2;
      
      const v = isRandom 
        ? (Math.random() - 0.5) * V0 * 2.5 
        : V0 * (Math.cos(2 * Math.PI * STRICT_PHI * x_coord) + Math.cos(2 * Math.PI * STRICT_PHI * y_coord));
      
      lattice.push({
        id: i * GRID_SIZE + j,
        x: x_coord,
        y: y_coord,
        v,
        amplitude: 0.15 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        ipr: 1.0, 
        lyapunov: 0.1, // This is xi (Localization Length)
        isRandom
      });
    }
  }
  return lattice;
};

export const calculateScalingLaw = (U: number): number => {
  const { alpha0, delta } = PHYSICS_CONFIG;
  return alpha0 * (1 - Math.tanh(U / delta));
};

/**
 * WHERE: src/services/physics.ts
 * WHAT: Physics propagation with Phase Transition logic.
 * HOW: Calculates xi and IPR to drive Material Morphing.
 * WHY: Visualizes the transformation from fragmented "Liquid" to reconstructed "Solid".
 */
export const updateLatticePhysics = (
  lattice: LatticeSite[], 
  state: SimulationState, 
  time: number
): LatticeSite[] => {
  const { U, V0, jitter, omega, isRadiationBurst } = state;
  const detuning = Math.abs(omega - PHI);
  
  // Severe instability triggers when thresholds are crossed
  const isHeating = jitter > JITTER_THRESHOLD || detuning > 0.08;
  const alpha = isHeating ? 1.0 : calculateScalingLaw(U) + detuning * 2;

  return lattice.map(site => {
    // Localization Length (xi): Radius of the influence sphere
    // As jitter/detuning increases, xi explodes (bleeding into neighbors)
    const xi = isHeating 
      ? 8.0 + (jitter / 15) + (detuning * 10) // Liquid/Delocalized
      : Math.max(0.3, 1.2 / (Math.log(Math.abs(V0) + 1.2) + 0.1) + detuning * 15);
    
    // IPR: Participation ratio determines "Order" vs "Chaos"
    const ipr = site.isRandom ? 0.05 : Math.max(0.01, (V0 / 5) * (1 - (isHeating ? 0.98 : 0.02)));
    
    const freq = 1.0 + (1 / (ipr + 0.1)) * 0.3 + alpha * 1.5;
    const noise = (isHeating ? 0.25 : 0.01) + (isRadiationBurst ? 0.4 : 0) + (detuning * 0.5);
    
    let newAmp = site.amplitude + Math.sin(time * freq + site.phase) * 0.02 + (Math.random() - 0.5) * noise;
    newAmp = Math.max(0.02, Math.min(2.0, newAmp));
    
    return {
      ...site,
      amplitude: newAmp,
      ipr,
      lyapunov: xi // xi for the Influence Sphere
    };
  });
};

export const calculateMSD = (time: number, U: number, jitter: number, omega: number): number => {
  const detuning = Math.abs(omega - PHI);
  const isHeating = jitter > JITTER_THRESHOLD || detuning > 0.08;
  const alpha = isHeating ? 1.0 : calculateScalingLaw(U) + (detuning * 4);
  return Math.pow(time + 1, Math.min(1.0, alpha));
};

export const generateLevelSpacing = (isHeating: boolean): number[] => {
  const bins = 20;
  const data: number[] = [];
  for (let i = 0; i < bins; i++) {
    const s = i / (bins / 3);
    const val = isHeating ? (Math.PI / 2) * s * Math.exp(-(Math.PI / 4) * s * s) : Math.exp(-s);
    data.push(val + (Math.random() * 0.04));
  }
  return data;
};