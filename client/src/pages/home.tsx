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

    // Create ASCII sea/ocean effect
    const initializeFluid = () => {
      particlesRef.current = [];
      
      // Create dense ASCII sea at bottom of screen
      const cols = Math.floor(canvas.width / 8); // Closer spacing for sea effect
      const rows = Math.floor(POOL_HEIGHT / 12); // Multiple rows for depth
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * 8 + 4; // Regular grid spacing
          const y = canvas.height - POOL_HEIGHT + row * 12; // Stack rows from bottom
          
          particlesRef.current.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 1,
            m: 1.0,
            rho: RHO0,
            p: 0,
            fx: 0,
            fy: 0,
            charIndex: Math.floor(Math.random() * 6), // Use first 6 wave characters
            colorIndex: 0
          });
        }
      }
      console.log(`Created ${particlesRef.current.length} particles for ASCII sea`);
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

    // Simple wave simulation for ASCII sea
    const updateFluid = () => {
      timeRef.current += 0.016;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        
        // Create wave motion with time and position
        const waveBase = Math.sin(timeRef.current + particle.x * 0.01) * 3;
        const waveSecondary = Math.sin(timeRef.current * 1.5 + particle.x * 0.008) * 2;
        const baseY = canvas.height - POOL_HEIGHT + (particle.y - (canvas.height - POOL_HEIGHT));
        
        // Mouse attraction when enabled
        if (attractOnRef.current) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200 && distance > 0) {
            const force = (1 - distance / 200) * 0.8;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }
        
        // Natural wave motion
        particle.vy += (baseY + waveBase + waveSecondary - particle.y) * 0.02;
        particle.vx += (Math.random() - 0.5) * 0.1; // Small random movement
        
        // Damping
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Keep particles in sea area
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < canvas.height - POOL_HEIGHT) particle.y = canvas.height - POOL_HEIGHT;
        if (particle.y > canvas.height - 20) particle.y = canvas.height - 20;
        
        // Update character based on wave motion
        const waveIntensity = Math.abs(waveBase + waveSecondary);
        if (waveIntensity > 4) {
          particle.charIndex = 14 + Math.floor(Math.random() * 4); // Intense wave chars
        } else if (waveIntensity > 2) {
          particle.charIndex = 8 + Math.floor(Math.random() * 6); // Medium wave chars
        } else {
          particle.charIndex = Math.floor(Math.random() * 8); // Calm wave chars
        }
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
      
      // Set font for ASCII fluid rendering - use fallback fonts
      ctx.font = `${PARTICLE_SIZE}px Monaco, Consolas, "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // ASCII Sea rendering
      

      
      // Render ASCII sea with dynamic colors
      particlesRef.current.forEach(particle => {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const distanceFromMouse = Math.sqrt(
          (mouseRef.current.x - particle.x) ** 2 + (mouseRef.current.y - particle.y) ** 2
        );
        
        // Sea coloring - cyan/blue tones
        if (distanceFromMouse < 100 && attractOnRef.current) {
          // Mouse attraction - bright aqua colors
          ctx.fillStyle = 'rgba(0, 255, 255, 0.9)'; // Bright cyan
        } else if (speed > 3) {
          // Active waves - medium cyan
          ctx.fillStyle = 'rgba(64, 224, 255, 0.8)';
        } else if (speed > 1) {
          // Gentle waves - soft cyan  
          ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
        } else {
          // Calm sea - dim blue-cyan
          ctx.fillStyle = 'rgba(120, 180, 220, 0.6)';
        }
        
        // Render sea character
        const char = FLUID_CHARS[Math.max(0, Math.min(particle.charIndex, FLUID_CHARS.length - 1))];
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