import { useEffect, useRef, useState } from 'react';

interface FluidParticle {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  char: string;
  intensity: number;
  waveOffset: number;
  isSplash: boolean;
  splashLife: number;
  mass: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isMouseOverButtonRef = useRef(false);
  const particlesRef = useRef<FluidParticle[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // ASCII characters for fluid simulation
  const FLUID_CHARS = ['~', '≈', '∼', '⌐', '¬', '∩', '∪', '°', '·', '`', ',', '.', ':', ';', '▴', '▾', '◆', '◇'];
  const PARTICLE_SIZE = 16;
  const POOL_HEIGHT = 120; // Height of fluid pool from bottom
  const ATTRACTION_RADIUS = 350;
  const MAX_RISE_HEIGHT = 500;

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

    // Initialize fluid pool
    const initializeFluid = () => {
      const cols = Math.floor(canvas.width / PARTICLE_SIZE);
      const poolRows = Math.floor(POOL_HEIGHT / PARTICLE_SIZE);
      
      particlesRef.current = [];
      
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < poolRows; y++) {
          const baseY = canvas.height - POOL_HEIGHT + (y * PARTICLE_SIZE);
          particlesRef.current.push({
            x: x * PARTICLE_SIZE + PARTICLE_SIZE/2,
            y: baseY + Math.random() * 10 - 5,
            baseY: baseY,
            vx: 0,
            vy: 0,
            char: FLUID_CHARS[Math.floor(Math.random() * 14)], // Avoid splash chars initially
            intensity: Math.random() * 0.3 + 0.5,
            waveOffset: Math.random() * Math.PI * 2,
            isSplash: false,
            splashLife: 0,
            mass: Math.random() * 0.3 + 0.7
          });
        }
      }
    };

    // Create splash particles
    const createSplash = (x: number, y: number, intensity: number) => {
      const splashCount = Math.floor(intensity * 8 + 4);
      for (let i = 0; i < splashCount; i++) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y,
          baseY: canvas.height - POOL_HEIGHT + Math.random() * POOL_HEIGHT,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 6 - 2,
          char: FLUID_CHARS[14 + Math.floor(Math.random() * 4)], // Use splash chars
          intensity: Math.random() * 0.8 + 0.4,
          waveOffset: Math.random() * Math.PI * 2,
          isSplash: true,
          splashLife: 60 + Math.random() * 40,
          mass: 0.3 + Math.random() * 0.2
        });
      }
    };

    // Fluid physics simulation  
    const updateFluid = () => {
      timeRef.current += 0.016;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      // Update all particles without removing during iteration
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const particle = particlesRef.current[i];
        
        // Remove expired splash particles
        if (particle.isSplash && particle.splashLife <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        
        // Handle splash particles differently
        if (particle.isSplash) {
          particle.splashLife--;
          
          // Gravity for splash particles
          particle.vy += 0.4;
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Bounce off ground
          if (particle.y > canvas.height - 15) {
            particle.y = canvas.height - 15;
            particle.vy *= -0.4;
            particle.vx *= 0.8;
          }
          
          // Fade and slow down
          particle.vx *= 0.98;
          particle.intensity *= 0.995;
          continue;
        }
        
        // Base wave motion for regular particles
        const waveInfluence = Math.sin(timeRef.current * 1.5 + particle.waveOffset + particle.x * 0.008) * 6;
        const targetY = particle.baseY + waveInfluence;
        
        if (!isMouseOverButtonRef.current) {
          // Very strong mouse attraction for dramatic waves
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < ATTRACTION_RADIUS && distance > 0) {
            // Much stronger attraction with exponential falloff
            const normalizedDistance = distance / ATTRACTION_RADIUS;
            const attractionForce = (1 - normalizedDistance) ** 1.5; // Less steep falloff for wider effect
            
            // Extra strong vertical attraction for wave formation
            const verticalBoost = mouseY < particle.baseY ? 3.5 : 2.0;
            const attractionStrength = attractionForce * 2.5 * verticalBoost;
            
            particle.vx += (dx / distance) * attractionStrength * 0.8;
            particle.vy += (dy / distance) * attractionStrength;
            
            // Massive upward force for dramatic waves
            if (distance < 120) {
              const upwardForce = -3.0 * attractionForce * (120 - distance) / 120;
              particle.vy += upwardForce;
            }
          }
        } else {
          // Button hover - dramatic crash with strong gravity
          if (particle.y < canvas.height - POOL_HEIGHT - 30) {
            particle.vy += 1.2; // Very strong gravity for dramatic crash
            
            // Create splash when crashing down hard
            if (particle.vy > 2.5 && particle.y > canvas.height - POOL_HEIGHT - 40) {
              createSplash(particle.x, particle.y, Math.abs(particle.vy) * 0.4);
            }
          } else {
            particle.vy += 0.4; // Normal gravity in pool
          }
        }
        
        // Restore to base position (weaker when mouse is near)
        const restoreStrength = isMouseOverButtonRef.current ? 0.08 : 0.03;
        const restoreForceY = (targetY - particle.y) * restoreStrength;
        particle.vy += restoreForceY;
        
        // Horizontal restoration
        const homeX = Math.round(particle.x / PARTICLE_SIZE) * PARTICLE_SIZE;
        const restoreForceX = (homeX - particle.x) * 0.01;
        particle.vx += restoreForceX;
        
        // Mass-based damping
        const dampingFactor = 0.88 + particle.mass * 0.05;
        particle.vx *= dampingFactor;
        particle.vy *= dampingFactor;
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Boundary collisions with bounce
        if (particle.y > canvas.height - 8) {
          particle.y = canvas.height - 8;
          particle.vy *= -0.4;
          
          // Create small splash on hard impact
          if (Math.abs(particle.vy) > 2) {
            createSplash(particle.x, particle.y, Math.abs(particle.vy) * 0.2);
          }
        }
        
        // Side boundaries with bounce
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx *= -0.6;
          particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        }
        
        // Upper boundary - allow higher rising
        const maxHeight = canvas.height - POOL_HEIGHT - MAX_RISE_HEIGHT;
        if (particle.y < maxHeight) {
          particle.y = maxHeight;
          particle.vy = Math.abs(particle.vy) * 0.3; // Bounce down
        }
        
        // Dynamic character selection based on behavior
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const heightFactor = (canvas.height - particle.y) / (POOL_HEIGHT + MAX_RISE_HEIGHT);
        
        if (speed > 2.5) {
          particle.char = FLUID_CHARS[Math.min(17, 10 + Math.floor(speed))];
        } else if (speed > 1.2) {
          particle.char = FLUID_CHARS[6 + Math.floor(speed * 2)];
        } else if (heightFactor > 0.8) {
          particle.char = FLUID_CHARS[Math.floor(Math.random() * 8)];
        } else if (heightFactor > 0.4) {
          particle.char = FLUID_CHARS[Math.floor(Math.random() * 6)];
        } else {
          particle.char = FLUID_CHARS[Math.floor(Math.random() * 4)];
        }
      }
      
      // Remove excess splash particles for performance
      const maxSplashParticles = 200;
      const splashCount = particlesRef.current.filter(p => p.isSplash).length;
      if (splashCount > maxSplashParticles) {
        particlesRef.current = particlesRef.current.filter((p, i) => 
          !p.isSplash || i < maxSplashParticles || p.splashLife > 30
        );
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
      
      // Debug particle count and canvas info
      if (Math.floor(timeRef.current * 10) % 60 === 0) {
        console.log(`Canvas: ${canvas.width}x${canvas.height}, Rendering ${particlesRef.current.length} particles`);
        if (particlesRef.current.length > 0) {
          const sample = particlesRef.current[0];
          console.log(`Sample: x=${sample.x.toFixed(1)}, y=${sample.y.toFixed(1)}, char="${sample.char}"`);
          console.log(`Font: ${ctx.font}, fillStyle: ${ctx.fillStyle}`);
        }
      }
      
      // Batch render by opacity for performance
      const regularParticles = particlesRef.current.filter(p => !p.isSplash);
      const splashParticles = particlesRef.current.filter(p => p.isSplash);
      
      // Render regular fluid particles - set color for each particle
      regularParticles.forEach(particle => {
        // Set bright, visible color for each particle
        ctx.fillStyle = 'rgba(0, 255, 255, 1.0)'; // Bright cyan
        
        // Simple rendering for visibility
        ctx.fillText(
          particle.char,
          particle.x,
          particle.y
        );
      });
      
      // Render splash particles with different styling
      splashParticles.forEach(particle => {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const lifeFactor = particle.splashLife / 100;
        let alpha = particle.intensity * lifeFactor;
        
        // Splash particles are brighter and more dynamic
        if (speed > 2) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha * 1.2, 1.0)})`;
        } else if (speed > 1) {
          ctx.fillStyle = `rgba(236, 254, 255, ${Math.min(alpha, 0.95)})`;
        } else {
          ctx.fillStyle = `rgba(165, 243, 252, ${Math.min(alpha, 0.8)})`;
        }
        
        const scale = (0.5 + speed * 0.2 + lifeFactor * 0.3) * particle.mass;
        
        ctx.save();
        ctx.scale(scale, scale);
        ctx.fillText(
          particle.char,
          particle.x / scale,
          particle.y / scale
        );
        ctx.restore();
      });
    };

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;
      updateFluid();
      renderFluid();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
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