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
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, velocityX: 0, velocityY: 0 });
  const isMouseOverButtonRef = useRef(false);
  const particlesRef = useRef<WaterParticle[]>([]);
  const attractOnRef = useRef(true);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const rippleRef = useRef({ active: false, x: 0, y: 0, intensity: 0, time: 0 });

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



    // Dynamic water simulation with mouse velocity and ripples
    const updateFluid = () => {
      timeRef.current += 0.016;
      const mouse = mouseRef.current;
      const ripple = rippleRef.current;
      
      // Update ripple effect
      if (ripple.active) {
        ripple.time += 0.016;
        ripple.intensity *= 0.98; // Fade out
        if (ripple.intensity < 0.1) {
          ripple.active = false;
        }
      }
      
      particlesRef.current.forEach((particle, i) => {
        // Base calm wave motion
        const wave = Math.sin(timeRef.current * 0.8 + particle.x * 0.005) * 2;
        const restY = particle.baseY + wave;
        
        // Mouse velocity creates wake effect
        const mouseSpeed = Math.sqrt(mouse.velocityX * mouse.velocityX + mouse.velocityY * mouse.velocityY);
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Mouse attraction based on proximity and speed
        if (dist < 250) {
          const proximityForce = (250 - dist) / 250;
          const speedMultiplier = Math.min(mouseSpeed * 0.1, 3); // Cap the effect
          
          // Basic attraction
          particle.vx += dx * proximityForce * 0.001;
          particle.vy += dy * proximityForce * 0.002;
          
          // Velocity-based wake effect
          if (mouseSpeed > 5) {
            const wakeForceX = mouse.velocityX * proximityForce * 0.05;
            const wakeForceY = mouse.velocityY * proximityForce * 0.05;
            particle.vx += wakeForceX;
            particle.vy += wakeForceY;
          }
          
          // Strong upward pull when mouse is above
          if (mouse.y < particle.y) {
            particle.vy -= proximityForce * (0.5 + speedMultiplier * 0.2);
          }
        }
        
        // Ripple effect from button clicks
        if (ripple.active) {
          const rippleDx = ripple.x - particle.x;
          const rippleDy = ripple.y - particle.y;
          const rippleDist = Math.sqrt(rippleDx * rippleDx + rippleDy * rippleDy);
          
          if (rippleDist < 300) {
            const rippleWave = Math.sin((rippleDist * 0.02) - (ripple.time * 8)) * ripple.intensity;
            particle.vx += (rippleDx / rippleDist) * rippleWave * 0.3;
            particle.vy += (rippleDy / rippleDist) * rippleWave * 0.3;
          }
        }
        
        // Return to rest position
        particle.vy += (restY - particle.y) * 0.015;
        
        // Apply velocity with damping
        particle.vx *= 0.94;
        particle.vy *= 0.94;
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Keep in bounds
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y > canvas.height - 20) particle.y = canvas.height - 20;
        
        // Dynamic character selection based on activity
        const speed = Math.abs(particle.vx) + Math.abs(particle.vy);
        const heightFromBase = Math.max(0, particle.baseY - particle.y);
        
        if (speed > 3 || heightFromBase > 30) {
          particle.charIndex = 8 + Math.floor(Math.random() * 6); // Active water
        } else if (speed > 1 || heightFromBase > 10) {
          particle.charIndex = 4 + Math.floor(Math.random() * 4); // Medium activity
        } else {
          particle.charIndex = Math.floor(Math.random() * 4); // Calm water
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

    // Enhanced mouse tracking with velocity calculation
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = mouseRef.current;
      
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      
      // Calculate velocity
      mouse.velocityX = mouse.x - mouse.prevX;
      mouse.velocityY = mouse.y - mouse.prevY;
    };

    // Button click creates ripple effect
    const handleButtonClick = (buttonX: number, buttonY: number) => {
      rippleRef.current = {
        active: true,
        x: buttonX,
        y: buttonY,
        intensity: 5,
        time: 0
      };
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

  const handleButtonClickWithRipple = (url: string, event: React.MouseEvent) => {
    // Get button position for ripple effect
    const rect = event.currentTarget.getBoundingClientRect();
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2 - canvasRect.left;
      const buttonCenterY = rect.top + rect.height / 2 - canvasRect.top;
      
      // Trigger ripple effect in water
      rippleRef.current = {
        active: true,
        x: buttonCenterX,
        y: buttonCenterY,
        intensity: 8, // Strong ripple for button clicks
        time: 0
      };
    }
    
    // Open link after short delay to show ripple effect
    setTimeout(() => {
      window.open(url, '_blank');
    }, 150);
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
            onClick={(e) => handleButtonClickWithRipple('https://instagram.com/username', e)}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                       active:scale-95 active:bg-slate-600/70 transform"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              instagram
            </span>
          </button>

          {/* YouTube Button */}
          <button
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={(e) => handleButtonClickWithRipple('https://youtube.com/channel/channelid', e)}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                       active:scale-95 active:bg-slate-600/70 transform"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              youtube
            </span>
          </button>

          {/* Mind Mapper Button */}
          <button
            onMouseEnter={() => handleButtonHover(true)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={(e) => handleButtonClickWithRipple('https://mindmapper-project.com', e)}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                       active:scale-95 active:bg-slate-600/70 transform"
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