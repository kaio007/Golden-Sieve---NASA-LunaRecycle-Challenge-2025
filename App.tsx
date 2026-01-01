import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SimulationState, LatticeSite, MSDPoint } from './types';
import { PHI, JITTER_THRESHOLD, COLORS, GRID_SIZE, SHARDS_PER_SITE } from './constants';
import { generateLattice, updateLatticePhysics, generateLevelSpacing } from './services/physics';
import HUD from './components/HUD';
import Chart from './components/Chart';
import SpectralMap from './components/SpectralMap';
import AuditLog from './components/AuditLog';

/**
 * WHERE: src/App.tsx
 * WHAT: Verifiable Al-Cu-Fe Forging Environment (v17.5).
 * REFINEMENT: Material Legend Integration, Lustrous Crystallization, and High-Contrast Lock.
 */

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    U: 1.5,
    V0: 2.5,
    jitter: 10,
    omega: PHI,
    showTechOverlay: true,
    showUnderTheHood: false,
    isRadiationBurst: false,
    isHeating: false,
    isBooting: true,
    bootProgress: 0,
    entropyWaveTime: null,
    entropyWaveOrigin: null,
    selectedSiteId: null,
    hoveredSiteId: null,
    hoveredComposition: null,
    isAutoProcess: true, 
    isNarrativeMode: true,
    missionStep: "INIT_FORGE_SEQUENCE",
    viewMode: 'NORMAL',
    focusMode: 'OPERATIONAL', 
    levelSpacing: generateLevelSpacing(false),
    entanglementEntropy: 0.15,
    chronosValue: 0.0,
    currentStage: 'RECONSTRUCTION',
    materialPhase: 0,
    sievingWaveProgress: -250,
    avalancheWaveProgress: -450,
    flareExcitation: 0
  });

  const [msdHistory, setMsdHistory] = useState<MSDPoint[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1440);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const stateRef = useRef(state);
  const timeRef = useRef(0);
  const latticeRef = useRef<LatticeSite[]>(generateLattice(2.5));
  
  const totalInstances = GRID_SIZE * GRID_SIZE * SHARDS_PER_SITE;
  const shardPositions = useRef<THREE.Vector3[]>([]);
  const shardVelocities = useRef<THREE.Vector3[]>([]);
  const shardInitialOffsets = useRef<THREE.Vector3[]>([]);

  useEffect(() => { 
    if (shardPositions.current.length === 0) {
      for (let i = 0; i < totalInstances; i++) {
        shardPositions.current.push(new THREE.Vector3(0, 0, 0));
        shardVelocities.current.push(new THREE.Vector3(0, 0, 0));
        shardInitialOffsets.current.push(new THREE.Vector3(
          (Math.random() - 0.5) * 160,
          (Math.random() - 0.5) * 160,
          (Math.random() - 0.5) * 160
        ));
      }
    }
  }, []);

  useEffect(() => { stateRef.current = state; }, [state]);

  const handleResize = () => {
    if (!rendererRef.current || !cameraRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    cameraRef.current.aspect = width / height;
    const focalShift = stateRef.current.chronosValue * 220;
    cameraRef.current.position.z = (width < 1024 ? 650 : 500) - focalShift;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(p => {
        const detuning = Math.abs(p.omega - PHI);
        const resilience = Math.max(0.005, 1.0 - (detuning * 15)); 

        if (!p.isBooting) {
            let updates: Partial<SimulationState> = {};
            if (p.avalancheWaveProgress < 450) updates.avalancheWaveProgress = p.avalancheWaveProgress + (20 * resilience);
            if (p.flareExcitation > 0) updates.flareExcitation = Math.max(0, p.flareExcitation - (0.05 * resilience));
            return Object.keys(updates).length > 0 ? { ...p, ...updates } : p;
        }

        let updates: Partial<SimulationState> = {};
        const chronos = p.chronosValue;
        let step = 0.0035; 
        if (chronos > 0.6 && chronos < 0.9) step = 0.0018; 
        
        const nextChronos = Math.min(1.0, chronos + step);
        updates.chronosValue = nextChronos;
        updates.bootProgress = nextChronos;

        if (nextChronos < 0.3) {
            updates.missionStep = "PHASE-0: AMORPHOUS_CHAOS";
            updates.viewMode = 'NORMAL';
            updates.sievingWaveProgress = -250;
        } else if (nextChronos >= 0.3 && nextChronos < 0.6) {
            updates.missionStep = "PHASE-1: 4D_EXTRUSION_ENGAGED";
            updates.viewMode = '4D';
            updates.sievingWaveProgress = -250;
        } else if (nextChronos >= 0.6 && nextChronos < 0.88) {
            updates.missionStep = "PHASE-2: GOLDEN_SIEVING_SWEEP";
            updates.viewMode = '4D';
            updates.sievingWaveProgress = THREE.MathUtils.mapLinear(nextChronos, 0.6, 0.88, -220, 250);
        } else if (nextChronos >= 0.88 && nextChronos < 1.0) {
            updates.missionStep = "PHASE-3: TOPOLOGICAL_LOCK";
            updates.viewMode = 'NORMAL';
            updates.sievingWaveProgress = 250;
        } else {
            updates.isBooting = false;
            updates.isAutoProcess = false;
            updates.missionStep = "STABLE_LOCKED";
            updates.viewMode = 'NORMAL';
        }

        return { ...p, ...updates };
      });
    }, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020305, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x020305, 800, 5000); 
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 7000);
    camera.position.set(300, 300, 600); 
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Sieve Plane
    const sieveGeo = new THREE.PlaneGeometry(GRID_SIZE * 13, GRID_SIZE * 13, GRID_SIZE * 2, GRID_SIZE * 2);
    const sieveMat = new THREE.MeshStandardMaterial({ 
      color: COLORS.DRIVE_GOLD, wireframe: true, transparent: true, opacity: 0.08, emissive: COLORS.DRIVE_GOLD, emissiveIntensity: 0.6
    });
    const sieveMesh = new THREE.Mesh(sieveGeo, sieveMat);
    scene.add(sieveMesh);

    // Dynamic Sweeper
    const waveGeo = new THREE.PlaneGeometry(16, GRID_SIZE * 13);
    const waveMat = new THREE.MeshBasicMaterial({ color: COLORS.SIEVE_WAVE, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.rotation.y = Math.PI / 2;
    scene.add(waveMesh);

    const avalancheGeo = new THREE.PlaneGeometry(40, GRID_SIZE * 24);
    const avalancheMat = new THREE.MeshBasicMaterial({ color: 0xFF3300, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const avalancheMesh = new THREE.Mesh(avalancheGeo, avalancheMat);
    avalancheMesh.rotation.y = Math.PI / 2;
    scene.add(avalancheMesh);

    // 4D Strings
    const rayGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const rayMat = new THREE.MeshStandardMaterial({
        color: COLORS.TOPOLOGICAL_STRING,
        emissive: COLORS.TOPOLOGICAL_STRING,
        emissiveIntensity: 22.0,
        transparent: true,
        opacity: 0
    });
    const rayMesh = new THREE.InstancedMesh(rayGeo, rayMat, GRID_SIZE * GRID_SIZE);
    scene.add(rayMesh);

    // Primary Shard Cluster
    const shardGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    // Updated material for lustrous crystallization
    const shardMat = new THREE.MeshStandardMaterial({ 
        metalness: 0.7, 
        roughness: 0.2, 
        transparent: false, 
        depthWrite: true 
    });
    const instMesh = new THREE.InstancedMesh(shardGeo, shardMat, totalInstances);
    scene.add(instMesh);

    const shadowMat = new THREE.MeshStandardMaterial({ color: 0x7700FF, transparent: true, opacity: 0, wireframe: true });
    const shadowMesh = new THREE.InstancedMesh(shardGeo, shadowMat, totalInstances);
    scene.add(shadowMesh);

    scene.add(new THREE.AmbientLight(0xffffff, 1.3)); 
    const mainLight = new THREE.DirectionalLight(0xffffff, 8);
    mainLight.position.set(400, 800, 500);
    scene.add(mainLight);

    const tempObj = new THREE.Object3D();
    const tempCol = new THREE.Color();
    const greyCol = new THREE.Color('#94A3B8'); 
    const cyanCol = new THREE.Color(COLORS.STABLE);
    
    const speciesColors = [
      new THREE.Color(COLORS.ALUMINUM),
      new THREE.Color(COLORS.COPPER),
      new THREE.Color(COLORS.IRON),
      new THREE.Color(COLORS.ALUMINUM)
    ];

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      timeRef.current += 0.04;

      latticeRef.current = updateLatticePhysics(latticeRef.current, s, timeRef.current);
      
      const detuning = Math.abs(s.omega - PHI);
      const resilience = Math.max(0, 1.0 - (detuning * 12));
      
      const sieveBaseZ = -250 + (s.chronosValue * 240); 
      sieveMesh.position.z = sieveBaseZ;
      const sPos = sieveGeo.attributes.position;
      const landscapeAmplitude = s.V0 * 2.8 * s.chronosValue;

      for (let i = 0; i < sPos.count; i++) {
          const x = sPos.getX(i);
          const y = sPos.getY(i);
          const v = Math.cos(2 * Math.PI * s.omega * (x/9)) + Math.cos(2 * Math.PI * s.omega * (y/9));
          sPos.setZ(i, v * landscapeAmplitude);
      }
      sPos.needsUpdate = true;

      waveMesh.position.x = s.sievingWaveProgress;
      waveMesh.position.z = sieveBaseZ;
      waveMesh.visible = s.sievingWaveProgress > -215 && s.sievingWaveProgress < 215;

      avalancheMesh.position.x = s.avalancheWaveProgress;
      avalancheMesh.position.z = sieveBaseZ;
      if (s.avalancheWaveProgress > -380 && s.avalancheWaveProgress < 380) {
          avalancheMat.opacity = 0.98 * (1.0 - Math.abs(s.avalancheWaveProgress / 400));
          avalancheMesh.scale.x = 1.0 + Math.sin(timeRef.current * 18) * 0.45;
      } else {
          avalancheMat.opacity = 0;
      }

      const targetRayOpacity = s.viewMode === '4D' ? 0.85 : 0;
      rayMat.opacity = THREE.MathUtils.lerp(rayMat.opacity, targetRayOpacity, 0.1);
      shadowMat.opacity = THREE.MathUtils.lerp(shadowMat.opacity, s.viewMode === '4D' ? 0.5 : 0, 0.1);

      latticeRef.current.forEach((site, siteIdx) => {
        const distFromSweep = site.x - s.sievingWaveProgress;
        let localForgeFactor = s.chronosValue > 0.99 ? 1.0 : THREE.MathUtils.clamp(1 - (distFromSweep / 35), 0, 1);
        
        const siteTargetZ = (site.v * 2.2 * s.chronosValue);

        const firstShardIdx = siteIdx * SHARDS_PER_SITE;
        const posRef = shardPositions.current[firstShardIdx];
        const shardScale = 1.0 + (s.chronosValue * 3.8);

        if (rayMat.opacity > 0.01) {
            const height = Math.max(6.0, Math.abs(posRef.z - sieveBaseZ));
            tempObj.position.set(posRef.x, posRef.y, (posRef.z + sieveBaseZ) / 2);
            const rayThickness = 1.6 + (shardScale * 0.45); 
            tempObj.scale.set(rayThickness, height, rayThickness);
            tempObj.rotation.set(Math.PI / 2, 0, 0); 
            tempObj.updateMatrix();
            rayMesh.setMatrixAt(siteIdx, tempObj.matrix);
        }

        for (let j = 0; j < SHARDS_PER_SITE; j++) {
          const idx = siteIdx * SHARDS_PER_SITE + j;
          const pos = shardPositions.current[idx];
          const vel = shardVelocities.current[idx];
          const off = shardInitialOffsets.current[idx];

          const currentSpread = (1.0 - s.chronosValue) * 160;
          const targetX = site.x + off.x * (currentSpread/160);
          const targetY = site.y + off.y * (currentSpread/160);
          
          // Elevated Safety Buffer
          const zSafetyBuffer = 20.0; 
          const targetZ = sieveBaseZ + zSafetyBuffer + siteTargetZ + off.z * (currentSpread/160);

          let extrusionZ = 0;
          if (s.viewMode === '4D') {
              const freq = 6.0 + (j * 1.2);
              extrusionZ = Math.sin(timeRef.current * freq + idx) * 35.0; 
          }

          const agitation = (s.flareExcitation * 45) + (Math.abs(site.x - s.avalancheWaveProgress) < 75 ? 40 : (s.jitter > JITTER_THRESHOLD ? (s.jitter - JITTER_THRESHOLD) * 0.85 : 0));
          
          const isAtEnd = s.chronosValue > 0.999 && resilience > 0.99;
          const snapSpeed = (0.05 + (s.chronosValue * 0.9)) * (resilience * 0.98 + 0.02);
          
          if (agitation > 0.1) {
              const noise = agitation * (1.0 - resilience + 0.15);
              vel.x += (Math.random() - 0.5) * noise;
              vel.y += (Math.random() - 0.5) * noise;
              vel.z += (Math.random() - 0.5) * noise;
              vel.x += (targetX - pos.x) * (resilience * 0.5);
              vel.y += (targetY - pos.y) * (resilience * 0.5);
              vel.z += (targetZ - pos.z) * (resilience * 0.5);
              vel.multiplyScalar(0.48);
              pos.add(vel);
          } else {
              pos.x += (targetX - pos.x) * snapSpeed;
              pos.y += (targetY - pos.y) * snapSpeed;
              pos.z += (targetZ + extrusionZ - pos.z) * snapSpeed;
              vel.set(0, 0, 0);
              
              if (isAtEnd) {
                  pos.set(targetX, targetY, targetZ);
              }
          }

          tempObj.position.copy(pos);
          tempObj.scale.setScalar(shardScale * (1.0 + localForgeFactor * 0.8));
          tempObj.updateMatrix();
          instMesh.setMatrixAt(idx, tempObj.matrix);

          if (s.viewMode === '4D') {
            tempObj.position.set(pos.x, pos.y, pos.z - (extrusionZ * 1.6));
            tempObj.updateMatrix();
            shadowMesh.setMatrixAt(idx, tempObj.matrix);
          }

          // CRYSTALLIZATION COLOR
          const baseColor = speciesColors[j];
          tempCol.copy(greyCol);
          
          if (localForgeFactor > 0.005) {
              const heatPulse = Math.sin(localForgeFactor * Math.PI);
              // Force Cyan at lock but allow species undertone
              const colorBias = s.chronosValue > 0.98 ? cyanCol : baseColor;
              
              tempCol.lerp(new THREE.Color(1, 1, 1), localForgeFactor * 0.7);
              tempCol.lerp(colorBias, Math.pow(localForgeFactor, 0.8));
              
              const glowIntensity = 2.5 + (heatPulse * 50.0) + (localForgeFactor * 20.0);
              tempCol.multiplyScalar(glowIntensity);
          } else {
              tempCol.multiplyScalar(1.6 + Math.sin(timeRef.current * 6 + siteIdx) * 0.3);
          }
          
          if (s.flareExcitation > 0) tempCol.lerp(new THREE.Color(1, 0.4, 0.15), s.flareExcitation);
          
          instMesh.setColorAt(idx, tempCol);
        }
      });

      instMesh.instanceMatrix.needsUpdate = true;
      if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;
      if (rayMat.opacity > 0.01) rayMesh.instanceMatrix.needsUpdate = true;
      if (s.viewMode === '4D') shadowMesh.instanceMatrix.needsUpdate = true;
      
      renderer.render(scene, camera);
      controls.update();
    };

    animate();
    return () => { 
      cancelAnimationFrame(animId); 
      renderer.dispose(); 
    };
  }, []);

  const triggerFlare = () => {
    setState(p => ({ ...p, isRadiationBurst: true, flareExcitation: 1.0, isAutoProcess: false }));
    setTimeout(() => setState(p => ({ ...p, isRadiationBurst: false })), 2000);
  };

  const triggerAvalanche = () => {
    setState(p => ({ ...p, avalancheWaveProgress: -400, isAutoProcess: false }));
  };

  return (
    <div className="w-full h-screen relative text-[#E2E8F0] bg-[#020305] font-sans overflow-hidden">
      <div className={`fixed inset-0 z-[500] pointer-events-none transition-opacity duration-300 bg-orange-500/15 ${state.isRadiationBurst ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 z-0" />
        
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute z-[250] top-5 right-5 lg:top-8 lg:right-8 px-5 py-3 lg:px-7 lg:py-4 glass border-2 border-cyan-400/50 text-cyan-400 font-black uppercase tracking-[0.2em] lg:tracking-[0.4em] text-[9px] lg:text-[10px] hover:bg-cyan-400 hover:text-black transition-all active:scale-95 shadow-[0_0_40px_#00F2FF44] pointer-events-auto"
          >
            ACCESS MISSION CONTROL
          </button>
        )}

        <HUD state={state} onUpdateState={(u) => setState(p => ({ ...p, ...u, isAutoProcess: false }))} />

        {state.isNarrativeMode && (
           <div className="absolute bottom-36 lg:bottom-40 left-1/2 -translate-x-1/2 w-[95%] lg:w-[900px] text-center z-[150] pointer-events-none transition-all duration-500">
              <div className="bg-black/80 lg:bg-black/98 backdrop-blur-2xl lg:backdrop-blur-3xl border-l-4 lg:border-l-8 border-r-4 lg:border-r-8 border-cyan-400 px-6 lg:px-10 py-3 lg:py-8 shadow-[0_0_120px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-16">
                <span className="text-cyan-400 font-black uppercase tracking-[0.4em] lg:tracking-[0.8em] text-[7px] lg:text-[8px] block mb-1 lg:mb-3 opacity-70">Verifiable Material Narrative</span>
                <p className="text-sm lg:text-3xl font-bold italic text-white leading-tight tracking-tighter">
                  {state.missionStep === "STABLE_LOCKED" ? "\"TOPOLOGICAL EQUILIBRIUM: RECONSTRUCTION COMPLETE.\"" : `"${state.missionStep}"`}
                </p>
              </div>
           </div>
        )}

        <div className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 w-[95%] lg:w-[700px] glass p-4 lg:p-6 border-t-2 border-white/10 bg-black/98 pointer-events-auto z-[70] shadow-[0_0_100px_rgba(0,0,0,0.9)]">
            <div className="flex justify-between items-end mb-3 lg:mb-4">
               <div className="flex flex-col">
                  <h4 className="text-[9px] lg:text-[10px] font-black text-cyan-400 uppercase tracking-[0.8em] lg:tracking-[1em]">Forging Life-Cycle</h4>
                  <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-cyan-500 mt-1 opacity-80">Protocol: {state.missionStep}</span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-2xl lg:text-4xl font-black font-mono text-cyan-400 leading-none">{(state.chronosValue * 100).toFixed(0)}<span className="text-lg lg:text-xl">%</span></span>
               </div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.001" 
              value={state.chronosValue} 
              onChange={(e) => setState(prev => ({ ...prev, chronosValue: parseFloat(e.target.value), isAutoProcess: false, materialPhase: parseFloat(e.target.value) > 0.8 ? 1 : 0 }))} 
              className="w-full h-1.5 cursor-pointer appearance-none bg-white/10 rounded-full" 
            />
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 z-[600] w-full lg:w-[420px] transition-all duration-500 transform bg-[#05070A]/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-[-60px_0_200px_rgba(0,0,0,1)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 left-4 lg:hidden w-10 h-10 flex items-center justify-center border-2 border-white/20 text-white rounded-full bg-black/50 active:scale-90 z-[700]"
        >
          <span className="text-xl font-black">✕</span>
        </button>

        <div className="flex-grow overflow-y-auto p-5 lg:p-8 space-y-6 lg:space-y-8 mt-12 lg:mt-0">
            <header className="flex items-center justify-between gap-4 lg:gap-6 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-cyan-600 flex items-center justify-center -rotate-6 border-2 border-white shrink-0 shadow-[0_0_30px_#0891B244]">
                      <span className="text-black font-black text-xl lg:text-2xl italic">GS</span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                      <h1 className="text-lg lg:text-xl font-black uppercase tracking-tighter text-white italic truncate leading-none">Golden Sieve</h1>
                      <p className="text-[8px] lg:text-[9px] text-cyan-400 uppercase tracking-[0.4em] lg:tracking-[0.6em] font-black mt-1">Mission Control</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="hidden lg:flex px-3 py-2 border border-white/10 hover:border-white/40 text-slate-500 hover:text-white transition-all rounded-sm uppercase font-black text-[9px] tracking-widest"
                >
                  Close ✕
                </button>
            </header>

            <div className="space-y-6 lg:space-y-8">
               {/* MATERIAL COMPOSITION KEY */}
               <div className="p-4 border border-white/10 bg-black/40 space-y-3">
                  <h5 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[8px] lg:text-[9px] border-b border-white/5 pb-2">Material Composition Key</h5>
                  <div className="grid grid-cols-1 gap-2">
                     <div className="flex items-center justify-between p-2 lg:p-3 border border-cyan-400/20 bg-cyan-400/5">
                        <div className="flex items-center gap-3">
                           <div className="w-3 h-3 bg-[#00F2FF] shadow-[0_0_10px_#00F2FF]" />
                           <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-white">Aluminum (Al)</span>
                        </div>
                        <span className="text-[8px] lg:text-[9px] font-bold text-cyan-400 uppercase tracking-tighter">Matrix Base</span>
                     </div>
                     <div className="flex items-center justify-between p-2 lg:p-3 border border-orange-400/20 bg-orange-400/5">
                        <div className="flex items-center gap-3">
                           <div className="w-3 h-3 bg-[#FF8800] shadow-[0_0_10px_#FF8800]" />
                           <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-white">Copper (Cu)</span>
                        </div>
                        <span className="text-[8px] lg:text-[9px] font-bold text-orange-400 uppercase tracking-tighter">Stabilizer</span>
                     </div>
                     <div className="flex items-center justify-between p-2 lg:p-3 border border-pink-400/20 bg-pink-400/5">
                        <div className="flex items-center gap-3">
                           <div className="w-3 h-3 bg-[#FF00FF] shadow-[0_0_10px_#FF00FF]" />
                           <span className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-white">Iron (Fe)</span>
                        </div>
                        <span className="text-[8px] lg:text-[9px] font-bold text-pink-400 uppercase tracking-tighter">Magnetic Trap</span>
                     </div>
                  </div>
               </div>

               {state.focusMode === 'OPERATIONAL' && (
                  <div className="p-4 border-2 border-red-500/20 bg-red-500/5 space-y-3 lg:space-y-4 animate-in fade-in slide-in-from-right-4">
                     <h5 className="text-red-500 font-black uppercase tracking-widest text-[8px] lg:text-[9px] border-b border-red-500/10 pb-2">Environmental Hazards</h5>
                     <div className="grid grid-cols-2 gap-2 lg:gap-3">
                        <button onClick={triggerFlare} className="flex flex-col items-center gap-1 p-3 lg:p-4 border border-orange-500/40 hover:bg-orange-500 hover:text-black transition-all group active:scale-95 shadow-[0_0_15px_#F9731611]">
                           <span className="text-orange-500 group-hover:text-black font-black text-[8px] lg:text-[10px] uppercase tracking-[0.1em] text-center">Solar Flare</span>
                        </button>
                        <button onClick={triggerAvalanche} className="flex flex-col items-center gap-1 p-3 lg:p-4 border border-red-600/40 hover:bg-red-600 hover:text-black transition-all group active:scale-95 shadow-[0_0_15px_#EF444411]">
                           <span className="text-red-600 group-hover:text-black font-black text-[8px] lg:text-[10px] uppercase tracking-[0.1em] text-center">Phason Wave</span>
                        </button>
                     </div>
                  </div>
               )}

               <ParamItem label="Drive Omega" desc="Frequency (Phi)" value={state.omega.toFixed(3)}>
                  <input type="range" min="1.45" max="1.75" step="0.001" value={state.omega} onChange={e => setState(s => ({...s, omega: parseFloat(e.target.value), isAutoProcess: false}))} />
               </ParamItem>

               <ParamItem label="Potential V0" desc="Barrier Depth" value={state.V0.toFixed(1)}>
                  <input type="range" min="0" max="12" step="0.1" value={state.V0} onChange={e => setState(s => ({...s, V0: parseFloat(e.target.value), isAutoProcess: false}))} />
               </ParamItem>

               {state.focusMode === 'OPERATIONAL' && (
                  <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-right-4">
                     <ParamItem label="Timing Jitter" desc="Temporal Noise" value={`${state.jitter}ps`}>
                        <input type="range" min="0" max="100" step="1" value={state.jitter} onChange={e => setState(s => ({...s, jitter: parseInt(e.target.value), isAutoProcess: false}))} />
                     </ParamItem>
                     <ParamItem label="Interaction U" desc="Repulsion" value={state.U.toFixed(1)}>
                        <input type="range" min="0" max="10" step="0.1" value={state.U} onChange={e => setState(s => ({...s, U: parseFloat(e.target.value), isAutoProcess: false}))} />
                     </ParamItem>
                     <AuditLog state={state} time={timeRef.current} />
                  </div>
               )}

               {state.focusMode === 'PHYSICS' && (
                  <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-right-4">
                     <ParamItem label="Interaction U" desc="Hopping Strength" value={state.U.toFixed(1)}>
                        <input type="range" min="0" max="10" step="0.1" value={state.U} onChange={e => setState(s => ({...s, U: parseFloat(e.target.value), isAutoProcess: false}))} />
                     </ParamItem>
                     <div className="p-4 border border-cyan-400/20 bg-cyan-400/5 space-y-3">
                        <h5 className="text-cyan-400 font-black uppercase tracking-widest text-[8px] lg:text-[9px] border-b border-cyan-400/10 pb-2">Dimensional Projections</h5>
                        <div className="flex gap-2">
                           {['NORMAL', '4D'].map(v => (
                              <button key={v} onClick={() => setState(s => ({ ...s, viewMode: v as any }))} className={`flex-1 py-2 lg:py-3 font-black text-[8px] lg:text-[9px] tracking-widest border transition-all ${state.viewMode === v ? 'bg-cyan-400 text-black border-white' : 'text-cyan-400 border-cyan-400/40 hover:border-cyan-400'}`}>
                                 {v}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               {state.focusMode === 'ANALYSIS' && (
                  <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-right-4">
                     <Chart data={msdHistory} />
                     <SpectralMap omega={state.omega} v0={state.V0} />
                  </div>
               )}

               <div className="p-4 border border-white/10 bg-black/60 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 lg:pb-3">
                    <h5 className="text-slate-400 font-black uppercase tracking-widest text-[8px] lg:text-[9px]">Phason Lock Resonance</h5>
                    {Math.abs(state.omega - PHI) > 0.002 && (
                       <button onClick={() => setState(s => ({ ...s, omega: PHI }))} className="bg-emerald-500 px-2 py-1 text-[7px] lg:text-[8px] font-black text-black uppercase tracking-tighter hover:bg-white transition-all animate-pulse">
                         SNAP TO PHI
                       </button>
                    )}
                  </div>
                  <div className="relative h-10 lg:h-12 w-full bg-slate-950 overflow-hidden border border-white/5 shadow-inner">
                     <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-20 lg:w-24 bg-emerald-500/10 border-x border-emerald-500/20 flex items-center justify-center">
                        <span className="text-[7px] lg:text-[8px] text-emerald-500 font-black tracking-[0.4em] animate-pulse whitespace-nowrap uppercase">SYNCED</span>
                     </div>
                     <div className="absolute inset-y-0 w-1 bg-white shadow-[0_0_15px_white] z-10 transition-all duration-500" style={{ left: `${50 + (state.omega - PHI) * 200}%` }} />
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ParamItem: React.FC<{ label: string, desc: string, value: string, children: React.ReactNode }> = ({ label, desc, value, children }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-end">
        <div className="flex flex-col overflow-hidden">
            <span className="text-[11px] lg:text-[13px] font-black uppercase tracking-[0.3em] text-white leading-none mb-1 truncate">{label}</span>
            <span className="text-[7px] lg:text-[9px] text-slate-500 uppercase tracking-widest font-bold truncate opacity-80">{desc}</span>
        </div>
        <span className="font-mono text-xl lg:text-2xl font-black text-white ml-3">{value}</span>
    </div>
    <div className="mt-1">{children}</div>
  </div>
);

export default App;