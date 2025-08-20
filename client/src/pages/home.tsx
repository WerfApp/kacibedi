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
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isMouseOverButtonRef = useRef(false);
  const particlesRef = useRef<FluidParticle[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // ASCII characters for fluid simulation
  const FLUID_CHARS = ['~', '≈', '∼', '⌐', '¬', '∩', '∪', '°', '·', '`', ',', '.', ':', ';'];
  const PARTICLE_SIZE = 8;
  const POOL_HEIGHT = 150; // Height of fluid pool from bottom

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
            x: x * PARTICLE_SIZE,
            y: baseY + Math.random() * 20 - 10,
            baseY: baseY,
            vx: 0,
            vy: 0,
            char: FLUID_CHARS[Math.floor(Math.random() * FLUID_CHARS.length)],
            intensity: Math.random() * 0.5 + 0.3,
            waveOffset: Math.random() * Math.PI * 2
          });
        }
      }
    };

    // Fluid physics simulation
    const updateFluid = () => {
      timeRef.current += 0.016; // Roughly 60fps
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      particlesRef.current.forEach((particle, index) => {
        // Base wave motion
        const waveInfluence = Math.sin(timeRef.current * 2 + particle.waveOffset + particle.x * 0.01) * 8;
        const targetY = particle.baseY + waveInfluence;
        
        if (!isMouseOverButtonRef.current) {
          // Mouse attraction when not hovering over buttons
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200 && distance > 0) {
            const force = (200 - distance) / 200;
            const attractionStrength = 0.5;
            particle.vx += (dx / distance) * force * attractionStrength;
            particle.vy += (dy / distance) * force * attractionStrength;
            
            // Create ripple effect
            if (distance < 50) {
              particle.y += Math.sin(timeRef.current * 8 + distance * 0.1) * force * 10;
            }
          }
        } else {
          // When hovering over buttons, let fluid fall naturally
          particle.vy += 0.3; // Gravity
        }
        
        // Restore to base position
        const restoreForceY = (targetY - particle.y) * 0.05;
        particle.vy += restoreForceY;
        
        // Keep particles roughly in their horizontal area
        const restoreForceX = (particle.x - Math.round(particle.x / PARTICLE_SIZE) * PARTICLE_SIZE) * -0.02;
        particle.vx += restoreForceX;
        
        // Apply damping
        particle.vx *= 0.9;
        particle.vy *= 0.9;
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Keep particles in bounds
        if (particle.y > canvas.height - 10) {
          particle.y = canvas.height - 10;
          particle.vy *= -0.3;
        }
        if (particle.y < canvas.height - POOL_HEIGHT - 50) {
          particle.y = canvas.height - POOL_HEIGHT - 50;
          particle.vy *= -0.2;
        }
        
        // Update character based on movement and position
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const heightFactor = (canvas.height - particle.y) / POOL_HEIGHT;
        
        if (speed > 1.5) {
          particle.char = FLUID_CHARS[Math.min(13, Math.floor(speed * 2))];
        } else if (speed > 0.8) {
          particle.char = FLUID_CHARS[Math.min(9, 6 + Math.floor(speed * 2))];
        } else if (heightFactor > 0.7) {
          particle.char = FLUID_CHARS[Math.floor(Math.random() * 6)];
        } else {
          particle.char = FLUID_CHARS[Math.floor(Math.random() * 3)];
        }
      });
    };

    // Render fluid
    const renderFluid = () => {
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.4, '#1E293B');
      gradient.addColorStop(0.8, '#334155');
      gradient.addColorStop(1, '#475569');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set font for ASCII fluid rendering
      ctx.font = `${PARTICLE_SIZE}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      particlesRef.current.forEach(particle => {
        // Color based on particle movement, position and mouse distance
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const distanceFromMouse = Math.sqrt(
          (mouseRef.current.x - particle.x) ** 2 + (mouseRef.current.y - particle.y) ** 2
        );
        
        const heightFromBottom = canvas.height - particle.y;
        const depthFactor = heightFromBottom / POOL_HEIGHT;
        
        let alpha = Math.max(0.2, particle.intensity);
        
        // Mouse proximity effect
        if (!isMouseOverButtonRef.current && distanceFromMouse < 150) {
          alpha += (150 - distanceFromMouse) / 150 * 0.6;
        }
        
        // Movement-based intensity
        if (speed > 0.5) alpha += speed * 0.3;
        
        // Hokusai-inspired fluid colors
        if (speed > 2) {
          // Fast moving particles - bright cyan/white
          ctx.fillStyle = `rgba(236, 254, 255, ${Math.min(alpha, 0.95)})`;
        } else if (speed > 1) {
          // Medium speed - cyan
          ctx.fillStyle = `rgba(165, 243, 252, ${Math.min(alpha, 0.85)})`;
        } else if (speed > 0.3) {
          // Slow movement - blue-cyan
          ctx.fillStyle = `rgba(103, 232, 249, ${Math.min(alpha, 0.7)})`;
        } else if (depthFactor > 0.8) {
          // Surface particles - light blue
          ctx.fillStyle = `rgba(147, 197, 253, ${Math.min(alpha, 0.6)})`;
        } else if (depthFactor > 0.4) {
          // Mid-depth - darker blue
          ctx.fillStyle = `rgba(96, 165, 250, ${Math.min(alpha, 0.5)})`;
        } else {
          // Deep particles - dark blue-gray
          ctx.fillStyle = `rgba(71, 85, 105, ${Math.min(alpha, 0.4)})`;
        }
        
        // Add slight scaling based on depth and movement
        const scale = 0.8 + (depthFactor * 0.4) + (speed * 0.1);
        
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