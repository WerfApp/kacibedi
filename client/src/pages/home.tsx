import { useEffect, useRef, useState } from 'react';

interface WaterParticle {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  charIndex: number;
  intensity: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isMouseOverButtonRef = useRef(false);
  const particlesRef = useRef<WaterParticle[]>([]);
  const attractOnRef = useRef(true);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Water characters from calm to intense
  const WATER_CHARS = ['~', '≈', '∼', '⌐', '¬', '∩', '∪', '°', '·', '`', ',', '.', ':', ';', '▴', '▾', '◆', '◇'];
  
  const PARTICLE_SIZE = 14;
  const POOL_HEIGHT = 160;
  const ATTRACTION_RADIUS = 300;
  const MAX_RISE_HEIGHT = 350;

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

    // Create water pool at bottom of screen
    const initializeFluid = () => {
      particlesRef.current = [];
      
      // Dense water pool that sits at bottom
      const spacing = 8;
      const cols = Math.floor(canvas.width / spacing);
      const rows = Math.floor(POOL_HEIGHT / (spacing * 0.7));
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing + spacing/2;
          const baseY = canvas.height - POOL_HEIGHT + row * (spacing * 0.7);
          
          particlesRef.current.push({
            x: x + (Math.random() - 0.5) * 2,
            y: baseY + (Math.random() - 0.5) * 2,
            baseY: baseY,
            vx: 0,
            vy: 0,
            charIndex: Math.floor(Math.random() * 6),
            intensity: 0.5 + Math.random() * 0.3
          });
        }
      }
      console.log(`Created ${particlesRef.current.length} water particles`);
    };



    // Simple, working water simulation
    const updateFluid = () => {
      timeRef.current += 0.016;
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      particlesRef.current.forEach((particle, i) => {
        // Calm ambient wave motion
        const wave = Math.sin(timeRef.current + particle.x * 0.005) * 3;
        const restY = particle.baseY + wave;
        
        // Mouse attraction
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          const force = (200 - dist) / 200;
          particle.vx += dx * force * 0.001;
          particle.vy += dy * force * 0.002;
          
          // Strong upward pull when mouse is above
          if (mouseY < particle.y) {
            particle.vy -= force * 0.8;
          }
        }
        
        // Return to rest position
        particle.vy += (restY - particle.y) * 0.01;
        
        // Apply velocity with damping
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Keep in bounds
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y > canvas.height - 20) particle.y = canvas.height - 20;
        
        // Update character
        const speed = Math.abs(particle.vx) + Math.abs(particle.vy);
        if (speed > 2) {
          particle.charIndex = 6 + Math.floor(Math.random() * 6);
        } else {
          particle.charIndex = Math.floor(Math.random() * 6);
        }
      });
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
        
        // Render water character
        const char = WATER_CHARS[Math.max(0, Math.min(particle.charIndex, WATER_CHARS.length - 1))];
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