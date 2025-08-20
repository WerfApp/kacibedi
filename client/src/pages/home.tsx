import { useEffect, useRef, useState } from 'react';

interface WaveParticle {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  vx: number;
  vy: number;
  intensity: number;
  char: string;
  size: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isMouseOverButtonRef = useRef(false);
  const particlesRef = useRef<WaveParticle[]>([]);
  const animationRef = useRef<number>();

  // ASCII characters for wave pattern
  const WAVE_CHARS = ['~', '≈', '⌐', '¬', '∩', '∪', '°', '·'];
  const GRID_SIZE = 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas setup
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeWave();
    };

    // Initialize wave particles
    const initializeWave = () => {
      const cols = Math.floor(canvas.width / GRID_SIZE);
      const rows = Math.floor(canvas.height / GRID_SIZE);
      
      particlesRef.current = [];
      for (let x = 0; x < cols; x += 2) {
        for (let y = 0; y < rows; y += 2) {
          particlesRef.current.push({
            x: x,
            y: y,
            originalX: x,
            originalY: y,
            vx: 0,
            vy: 0,
            intensity: Math.random() * 0.3 + 0.1,
            char: WAVE_CHARS[Math.floor(Math.random() * WAVE_CHARS.length)],
            size: Math.random() * 0.8 + 0.4
          });
        }
      }
    };

    // Physics simulation
    const updateWave = () => {
      const mouseGridX = mouseRef.current.x / GRID_SIZE;
      const mouseGridY = mouseRef.current.y / GRID_SIZE;
      
      particlesRef.current.forEach(particle => {
        const dx = mouseGridX - particle.x;
        const dy = mouseGridY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (!isMouseOverButtonRef.current && distance < 15) {
          // Mouse attraction
          const force = (15 - distance) / 15;
          const attractionStrength = 0.3;
          particle.vx += (dx / distance) * force * attractionStrength;
          particle.vy += (dy / distance) * force * attractionStrength;
        } else {
          // Natural gravity and restoration
          const restoreX = particle.originalX - particle.x;
          const restoreY = particle.originalY - particle.y;
          particle.vx += restoreX * 0.02;
          particle.vy += restoreY * 0.02;
          particle.vy += 0.05; // Gravity effect
        }
        
        // Apply velocity with damping
        particle.vx *= 0.85;
        particle.vy *= 0.85;
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Update character based on movement intensity
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > 0.5) {
          particle.char = WAVE_CHARS[Math.min(Math.floor(speed * 3), WAVE_CHARS.length - 1)];
        } else {
          particle.char = WAVE_CHARS[0];
        }
      });
    };

    // Render wave
    const renderWave = () => {
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.5, '#1A202C');
      gradient.addColorStop(1, '#2D3748');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set font for ASCII rendering
      ctx.font = `${GRID_SIZE}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      particlesRef.current.forEach(particle => {
        const screenX = particle.x * GRID_SIZE;
        const screenY = particle.y * GRID_SIZE;
        
        // Color based on particle movement and position
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const distanceFromMouse = Math.sqrt(
          (mouseRef.current.x - screenX) ** 2 + (mouseRef.current.y - screenY) ** 2
        );
        
        let alpha = Math.max(0.1, particle.intensity - distanceFromMouse / 800);
        if (speed > 0.2) alpha += speed * 0.4;
        
        // Hokusai-inspired color scheme
        if (speed > 0.8) {
          ctx.fillStyle = `rgba(236, 254, 255, ${Math.min(alpha, 0.9)})`;
        } else if (speed > 0.4) {
          ctx.fillStyle = `rgba(165, 243, 252, ${alpha * 0.8})`;
        } else if (speed > 0.1) {
          ctx.fillStyle = `rgba(103, 232, 249, ${alpha * 0.6})`;
        } else {
          ctx.fillStyle = `rgba(113, 128, 150, ${alpha * 0.4})`;
        }
        
        ctx.save();
        ctx.scale(particle.size, particle.size);
        ctx.fillText(
          particle.char,
          screenX / particle.size,
          screenY / particle.size
        );
        ctx.restore();
      });
    };

    // Animation loop
    const animate = () => {
      updateWave();
      renderWave();
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
    <div className="relative min-h-screen overflow-hidden bg-hokusai-dark font-mono">
      {/* ASCII Wave Canvas Background */}
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
            className="group relative px-8 py-4 bg-hokusai-surface/30 border border-hokusai-border/50 backdrop-blur-sm
                       hover:bg-hokusai-surface-hover/40 hover:border-hokusai-border-hover/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-hokusai-accent focus:border-hokusai-accent"
          >
            <span className="text-sm font-mono text-hokusai-text group-hover:text-hokusai-text-hover transition-colors duration-300">
              instagram
            </span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-blue-400 to-cyan-400 transition-opacity duration-300" />
          </button>

          {/* YouTube Button */}
          <button
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={() => openLink('https://youtube.com/channel/channelid')}
            className="group relative px-8 py-4 bg-hokusai-surface/30 border border-hokusai-border/50 backdrop-blur-sm
                       hover:bg-hokusai-surface-hover/40 hover:border-hokusai-border-hover/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-hokusai-accent focus:border-hokusai-accent"
          >
            <span className="text-sm font-mono text-hokusai-text group-hover:text-hokusai-text-hover transition-colors duration-300">
              youtube
            </span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-red-400 to-pink-400 transition-opacity duration-300" />
          </button>

          {/* Mind Mapper Button */}
          <button
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={() => openLink('https://mindmapper-project.com')}
            className="group relative px-8 py-4 bg-hokusai-surface/30 border border-hokusai-border/50 backdrop-blur-sm
                       hover:bg-hokusai-surface-hover/40 hover:border-hokusai-border-hover/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-hokusai-accent focus:border-hokusai-accent"
          >
            <span className="text-sm font-mono text-hokusai-text group-hover:text-hokusai-text-hover transition-colors duration-300">
              mind mapper
            </span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-green-400 to-emerald-400 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
