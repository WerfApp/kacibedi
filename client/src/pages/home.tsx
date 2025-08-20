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

  // Enhanced ASCII characters for more interesting fluid simulation
  const FLUID_CHARS = [
    // Base fluid characters
    '~', '≈', '∼', '⌐', '¬', '∩', '∪', '°', '·', '`', ',', '.', ':', ';',
    // Wave and flow characters  
    '▴', '▾', '◆', '◇', '▲', '▼', '●', '○', '◉', '◎', '⦿', '⊙',
    // Intense motion characters
    '※', '⚡', '✦', '✧', '⋆', '★', '☆', '⭐', '✨', '💫',
    // Crash/splash characters
    '💥', '💦', '🌊', '🔥', '⚠', '‼', '❗', '⁂', '※', '⌘'
  ];
  const PARTICLE_SIZE = 12;
  const POOL_HEIGHT = 150; // Taller pool for better density
  const ATTRACTION_RADIUS = 280;
  const MAX_RISE_HEIGHT = 400;

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
      const cols = Math.floor(canvas.width / (PARTICLE_SIZE * 0.8)); // Denser packing
      const poolRows = Math.floor(POOL_HEIGHT / (PARTICLE_SIZE * 0.8));
      
      particlesRef.current = [];
      
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < poolRows; y++) {
          const baseY = canvas.height - POOL_HEIGHT + (y * PARTICLE_SIZE * 0.8);
          particlesRef.current.push({
            x: x * PARTICLE_SIZE * 0.8 + PARTICLE_SIZE/2,
            y: baseY + Math.random() * 6 - 3,
            baseY: baseY,
            vx: 0,
            vy: 0,
            char: FLUID_CHARS[Math.floor(Math.random() * 14)], // Start with basic characters
            intensity: Math.random() * 0.4 + 0.6,
            waveOffset: Math.random() * Math.PI * 2,
            isSplash: false,
            splashLife: 0,
            mass: Math.random() * 0.2 + 0.8
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
          // Powerful cursor attraction with realistic physics
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < ATTRACTION_RADIUS && distance > 0) {
            const normalizedDistance = distance / ATTRACTION_RADIUS;
            const attractionForce = (1 - normalizedDistance) ** 2; // Strong attraction
            
            // Direct attraction toward mouse
            const forceX = (dx / distance) * attractionForce * 4.0;
            const forceY = (dy / distance) * attractionForce * 4.0;
            
            particle.vx += forceX;
            particle.vy += forceY;
            
            // Extra upward boost when mouse is above
            if (mouseY < particle.y && distance < 150) {
              const upwardBoost = -attractionForce * 5.0;
              particle.vy += upwardBoost;
            }
            
            // Change to more dramatic characters when attracted
            if (distance < 80) {
              const charIndex = Math.min(FLUID_CHARS.length - 1, 24 + Math.floor(attractionForce * 16));
              particle.char = FLUID_CHARS[charIndex];
            }
          }
        } else {
          // Button hover - crash and flow effect
          if (particle.y < canvas.height - POOL_HEIGHT) {
            // Strong gravity for dramatic crash
            particle.vy += 1.8;
            
            // Spread horizontally when crashing
            const crashForce = Math.random() - 0.5;
            particle.vx += crashForce * 0.8;
            
            // Create splash on impact
            if (particle.vy > 3.0 && particle.y > canvas.height - POOL_HEIGHT - 30) {
              createSplash(particle.x, particle.y, Math.abs(particle.vy) * 0.5);
              // Change to crash characters
              particle.char = FLUID_CHARS[36 + Math.floor(Math.random() * 4)]; // Crash chars
            }
          } else {
            particle.vy += 0.5; // Gravity in pool
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
      

      
      // Batch render by opacity for performance
      const regularParticles = particlesRef.current.filter(p => !p.isSplash);
      const splashParticles = particlesRef.current.filter(p => p.isSplash);
      
      // Render regular fluid particles with dynamic colors
      regularParticles.forEach(particle => {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const distanceFromMouse = Math.sqrt(
          (mouseRef.current.x - particle.x) ** 2 + (mouseRef.current.y - particle.y) ** 2
        );
        
        // Dynamic coloring based on movement and attraction
        if (distanceFromMouse < 100 && !isMouseOverButtonRef.current) {
          // Close to mouse - bright energetic colors
          if (speed > 3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // White for high speed
          } else if (speed > 2) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'; // Gold for fast movement
          } else {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.9)'; // Cyan for attraction
          }
        } else if (speed > 2.5) {
          // Fast movement - bright cyan
          ctx.fillStyle = 'rgba(64, 224, 255, 0.8)';
        } else if (speed > 1.0) {
          // Medium movement - medium cyan
          ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
        } else {
          // Calm state - dim cyan
          ctx.fillStyle = 'rgba(120, 180, 220, 0.6)';
        }
        
        // Render the character
        ctx.fillText(particle.char, particle.x, particle.y);
      });
      
      // Render splash particles with dramatic effects
      splashParticles.forEach(particle => {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const lifeFactor = particle.splashLife / 100;
        
        // Bright, attention-grabbing colors for splash effects
        if (speed > 3) {
          ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // Bright white for high energy
        } else if (speed > 2) {
          ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'; // Red for impact
        } else if (speed > 1) {
          ctx.fillStyle = 'rgba(255, 150, 0, 0.8)'; // Orange for medium splash
        } else {
          ctx.fillStyle = 'rgba(100, 255, 255, 0.7)'; // Cyan for gentle droplets
        }
        
        // Larger scaling for splash visibility
        const scale = 1.2 + speed * 0.3 + lifeFactor * 0.5;
        
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