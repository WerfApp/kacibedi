import { useEffect, useRef, useState } from 'react';

interface SPHParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  m: number;
  rho: number;
  p: number;
  fx: number;
  fy: number;
  charIndex: number;
  colorIndex: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isMouseOverButtonRef = useRef(false);
  const particlesRef = useRef<SPHParticle[]>([]);
  const gridRef = useRef<Map<string, number[]>>(new Map());
  const attractOnRef = useRef(true);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // ASCII character palette for fluid mapping (keep existing art style)
  const FLUID_CHARS = ['~', '≈', '∼', '⌐', '¬', '∩', '∪', '°', '·', '`', ',', '.', ':', ';', '▴', '▾', '◆', '◇'];
  
  // SPH Constants (tunable)
  const H = 18; // Smoothing length
  const RHO0 = 8; // Rest density
  const K = 0.9; // Equation-of-state stiffness
  const MU = 0.15; // Viscosity
  const G = 40; // Gravity
  const CURSOR_G = 800; // Cursor attraction strength
  const CURSOR_FMAX = 140; // Max cursor force
  const CURSOR_EPS = 4; // Softening parameter
  const VMAX = 450; // Max velocity clamp
  const DAMPING = 0.3; // Boundary damping
  
  const PARTICLE_SIZE = 12;
  const POOL_HEIGHT = 150;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas setup
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeFluid();
    };

    // Initialize SPH fluid particles
    const initializeFluid = () => {
      const numParticles = 1800; // Target particle count for good performance
      const fluidWidth = canvas.width * 0.8;
      const fluidHeight = POOL_HEIGHT;
      
      particlesRef.current = [];
      
      for (let i = 0; i < numParticles; i++) {
        const x = (fluidWidth / Math.sqrt(numParticles)) * (i % Math.floor(Math.sqrt(numParticles))) + (canvas.width - fluidWidth) / 2;
        const y = canvas.height - fluidHeight + (fluidHeight / Math.sqrt(numParticles)) * Math.floor(i / Math.sqrt(numParticles));
        
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * H * 0.5,
          y: y + (Math.random() - 0.5) * H * 0.5,
          vx: 0,
          vy: 0,
          m: 1.0,
          rho: RHO0,
          p: 0,
          fx: 0,
          fy: 0,
          charIndex: Math.floor(Math.random() * FLUID_CHARS.length),
          colorIndex: 0
        });
      }
    };

    // SPH Kernels
    const poly6Kernel = (r: number) => {
      if (r >= H) return 0;
      const temp = H * H - r * r;
      return (4 / (Math.PI * Math.pow(H, 8))) * Math.pow(temp, 3);
    };

    const spikyGradient = (r: number) => {
      if (r >= H || r <= 0) return 0;
      return (-30 / (Math.PI * Math.pow(H, 5))) * Math.pow(H - r, 2);
    };

    const viscosityLaplacian = (r: number) => {
      if (r >= H) return 0;
      return (40 / (Math.PI * Math.pow(H, 5))) * (H - r);
    };

    // Spatial hashing for neighbor search  
    const buildSpatialHash = () => {
      gridRef.current.clear();
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        const gridX = Math.floor(particle.x / H);
        const gridY = Math.floor(particle.y / H);
        const key = `${gridX},${gridY}`;
        
        if (!gridRef.current.has(key)) {
          gridRef.current.set(key, []);
        }
        gridRef.current.get(key)!.push(i);
      }
    };

    // Get neighbors for particle
    const getNeighbors = (particle: SPHParticle) => {
      const neighbors: number[] = [];
      const gridX = Math.floor(particle.x / H);
      const gridY = Math.floor(particle.y / H);
      
      // Check 9 neighboring cells
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${gridX + dx},${gridY + dy}`;
          const cell = gridRef.current.get(key);
          if (cell) {
            neighbors.push(...cell);
          }
        }
      }
      return neighbors;
    };

    // SPH Physics simulation
    const updateFluid = () => {
      const dt = Math.min(0.033, Math.max(0.016, timeRef.current * 0.016));
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      // Build spatial hash
      buildSpatialHash();
      
      // Density pass
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        const neighbors = getNeighbors(particle);
        
        particle.rho = 0;
        for (const j of neighbors) {
          const neighbor = particlesRef.current[j];
          const dx = particle.x - neighbor.x;
          const dy = particle.y - neighbor.y;
          const r = Math.sqrt(dx * dx + dy * dy);
          particle.rho += neighbor.m * poly6Kernel(r);
        }
        
        // Pressure calculation
        particle.p = K * Math.max(particle.rho - RHO0, 0);
      }
      
      // Forces pass
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        const neighbors = getNeighbors(particle);
        
        particle.fx = 0;
        particle.fy = G * particle.m; // Gravity
        
        for (const j of neighbors) {
          if (i === j) continue;
          
          const neighbor = particlesRef.current[j];
          const dx = particle.x - neighbor.x;
          const dy = particle.y - neighbor.y;
          const r = Math.sqrt(dx * dx + dy * dy);
          
          if (r > 0) {
            // Pressure force
            const pressureForce = -neighbor.m * (particle.p + neighbor.p) / (2 * neighbor.rho) * spikyGradient(r);
            particle.fx += pressureForce * (dx / r);
            particle.fy += pressureForce * (dy / r);
            
            // Viscosity force
            const viscForce = MU * neighbor.m * viscosityLaplacian(r) / neighbor.rho;
            particle.fx += viscForce * (neighbor.vx - particle.vx);
            particle.fy += viscForce * (neighbor.vy - particle.vy);
          }
        }
        
        // Cursor attraction (only when enabled)
        if (attractOnRef.current) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          
          if (d > 1) {
            const force = Math.min(CURSOR_G / (d * d + CURSOR_EPS), CURSOR_FMAX) * particle.m;
            particle.fx += force * (dx / d);
            particle.fy += force * (dy / d);
          }
        }
      }
      
      // Integration
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        
        // Semi-implicit Euler
        const ax = particle.fx / particle.rho;
        const ay = particle.fy / particle.rho;
        
        particle.vx += ax * dt;
        particle.vy += ay * dt;
        
        // Clamp velocities
        const v = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (v > VMAX) {
          particle.vx = (particle.vx / v) * VMAX;
          particle.vy = (particle.vy / v) * VMAX;
        }
        
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        
        // Boundary conditions with reflection
        if (particle.x < 0) {
          particle.x = 0;
          particle.vx *= -DAMPING;
        }
        if (particle.x > canvas.width) {
          particle.x = canvas.width;
          particle.vx *= -DAMPING;
        }
        if (particle.y < 0) {
          particle.y = 0;
          particle.vy *= -DAMPING;
        }
        if (particle.y > canvas.height) {
          particle.y = canvas.height;
          particle.vy *= -DAMPING;
        }
        
        // Update character and color based on speed/density
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const densityFactor = Math.min(1.0, particle.rho / (RHO0 * 2));
        
        particle.charIndex = Math.floor((speed / 50 + densityFactor) * FLUID_CHARS.length * 0.5);
        particle.charIndex = Math.min(particle.charIndex, FLUID_CHARS.length - 1);
        particle.colorIndex = Math.floor(speed / 100);
      }
    };

    // Render fluid with optimizations
    const renderFluid = () => {
      if (!canvas || !ctx) return;
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.3, '#1E293B'); 
      gradient.addColorStop(0.7, '#334155');
      gradient.addColorStop(1, '#475569');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set font for ASCII fluid rendering
      ctx.font = `${PARTICLE_SIZE}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      

      
      // Render SPH particles with proper character mapping
      particlesRef.current.forEach(particle => {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const distanceFromMouse = Math.sqrt(
          (mouseRef.current.x - particle.x) ** 2 + (mouseRef.current.y - particle.y) ** 2
        );
        
        // Dynamic coloring based on movement and density
        if (distanceFromMouse < 100 && attractOnRef.current) {
          // Close to mouse and attraction enabled - bright colors
          if (speed > 50) {
            ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // White for high speed
          } else if (speed > 30) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'; // Gold for fast movement
          } else {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.9)'; // Cyan for attraction
          }
        } else if (speed > 40) {
          // Fast movement - bright cyan
          ctx.fillStyle = 'rgba(64, 224, 255, 0.8)';
        } else if (speed > 20) {
          // Medium movement - medium cyan
          ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
        } else {
          // Calm state - dim cyan
          ctx.fillStyle = 'rgba(120, 180, 220, 0.6)';
        }
        
        // Render the character from the palette
        const char = FLUID_CHARS[particle.charIndex];
        ctx.fillText(char, particle.x, particle.y);
      });
    };

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;
      updateFluid();
      renderFluid();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse tracking with proper canvas coordinates
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    // Initialize
    resizeCanvas();
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);
    animate();

    // Cleanup
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleButtonHover = (isHovering: boolean) => {
    isMouseOverButtonRef.current = isHovering;
    attractOnRef.current = !isHovering; // Disable attraction when hovering buttons
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 font-mono">
      {/* ASCII Fluid Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
      />
      
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="flex space-x-16 px-8">
          {/* Instagram Button */}
          <button
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={() => openLink('https://instagram.com/username')}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              instagram
            </span>
          </button>

          {/* YouTube Button */}
          <button
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={() => openLink('https://youtube.com/channel/channelid')}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              youtube
            </span>
          </button>

          {/* Mind Mapper Button */}
          <button
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={() => openLink('https://mindmapper-project.com')}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              mind mapper
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}