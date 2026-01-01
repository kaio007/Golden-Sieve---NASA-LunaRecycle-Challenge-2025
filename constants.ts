export const GRID_SIZE = 24;
export const SHARDS_PER_SITE = 4; 
export const PHI = (1 + Math.sqrt(5)) / 2; 
export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]; 
export const J_HOPPING = 1.0;
export const JITTER_THRESHOLD = 50; 

export const COLORS = {
  // Chemical Identity Mapping
  ALUMINUM: '#00F2FF', // Matrix (Cyan)
  COPPER: '#FF8800',   // Stabilizer (Orange)
  IRON: '#FF00FF',     // Magnetic Trap (Pink)
  FIBONACCI_DRIVE: '#FFD700', // Energy Field (Yellow)

  STABLE: '#00F2FF', 
  THERMAL: '#FFAA00', 
  EMERALD: '#00FF88', 
  BASE_NAVY: '#05070A', 
  DRIVE_GOLD: '#FFD700', 
  UI_STABLE: '#00F2FF',
  UI_DANGER: '#FF3366', 
  TOPOLOGICAL_STRING: '#7700FF',
  ENTROPY_WAVE: '#FF3366',
  
  PHASE_0: '#7A7A7A', // Brighter Rusty Grey for visibility
  SIEVE_WAVE: '#FFD700', 
  
  LBIT_SHADES: ['#00F2FF', '#FF8800', '#FF00FF', '#00F2FF'], // Mapped to Al, Cu, Fe, Al
  BACKLIGHT: '#1A1A2E'
};

export const PHYSICS_CONFIG = {
  alpha0: 1.0,
  delta: 2.5,
  decayRate: 0.05,
};