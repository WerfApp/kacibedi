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
  const [showPortfolio, setShowPortfolio] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hoveredButtonRef = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<WaterParticle[]>([]);
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



    // Simple water simulation with attraction zones
    const updateFluid = () => {
      timeRef.current += 0.016;
      const mouse = mouseRef.current;
      const ripple = rippleRef.current;
      
      // Update ripple effect
      if (ripple.active) {
        ripple.time += 0.016;
        ripple.intensity *= 0.98;
        if (ripple.intensity < 0.1) {
          ripple.active = false;
        }
      }
      
      particlesRef.current.forEach((particle) => {
        // Gentle ambient wave motion
        const wave = Math.sin(timeRef.current * 0.6 + particle.x * 0.008) * 1.5;
        const restY = particle.baseY + wave;
        
        // Button-based water attraction
        if (hoveredButtonRef.current) {
          const buttonX = hoveredButtonRef.current.x;
          const buttonY = hoveredButtonRef.current.y;
          
          // Distance from particle to button
          const dx = buttonX - particle.x;
          const dy = buttonY - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Strong attraction within 400px of hovered button
          if (dist < 400) {
            const force = Math.pow((400 - dist) / 400, 2) * 1.2;
            particle.vx += (dx / dist) * force;
            particle.vy += (dy / dist) * force;
            
            // Extra upward pull - water rises dramatically toward button
            particle.vy -= force * 2;
          }
        }
        
        // Ripple effect from button clicks
        if (ripple.active) {
          const rippleDx = ripple.x - particle.x;
          const rippleDy = ripple.y - particle.y;
          const rippleDist = Math.sqrt(rippleDx * rippleDx + rippleDy * rippleDy);
          
          if (rippleDist < 300) {
            const rippleWave = Math.sin((rippleDist * 0.02) - (ripple.time * 8)) * ripple.intensity;
            particle.vx += (rippleDx / rippleDist) * rippleWave * 0.4;
            particle.vy += (rippleDy / rippleDist) * rippleWave * 0.4;
          }
        }
        
        // Return to rest position
        particle.vy += (restY - particle.y) * 0.02;
        
        // Apply velocity with damping
        particle.vx *= 0.93;
        particle.vy *= 0.93;
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Keep in bounds
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y > canvas.height - 20) particle.y = canvas.height - 20;
        
        // Update character based on activity
        const speed = Math.abs(particle.vx) + Math.abs(particle.vy);
        const heightFromBase = Math.max(0, particle.baseY - particle.y);
        
        if (speed > 3 || heightFromBase > 40) {
          particle.charIndex = 8 + Math.floor(Math.random() * 4);
        } else if (speed > 1.5 || heightFromBase > 15) {
          particle.charIndex = 4 + Math.floor(Math.random() * 4);
        } else {
          particle.charIndex = Math.floor(Math.random() * 4);
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
      

      
      // Render ASCII water with attraction-based colors
      particlesRef.current.forEach(particle => {
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const distanceFromMouse = Math.sqrt(
          (mouseRef.current.x - particle.x) ** 2 + (mouseRef.current.y - particle.y) ** 2
        );
        
        // Color based on button proximity and activity
        let distanceFromButton = Infinity;
        if (hoveredButtonRef.current) {
          distanceFromButton = Math.sqrt(
            (hoveredButtonRef.current.x - particle.x) ** 2 + (hoveredButtonRef.current.y - particle.y) ** 2
          );
        }
        
        if (distanceFromButton < 150) {
          ctx.fillStyle = 'rgba(0, 255, 255, 0.95)'; // Bright cyan near button
        } else if (distanceFromButton < 300) {
          ctx.fillStyle = 'rgba(64, 224, 255, 0.8)'; // Medium cyan
        } else if (speed > 2) {
          ctx.fillStyle = 'rgba(100, 200, 255, 0.7)'; // Active water
        } else {
          ctx.fillStyle = 'rgba(120, 180, 220, 0.6)'; // Calm water
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

    // Simple mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
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

  const handleButtonHover = (isHovering: boolean, event?: React.MouseEvent) => {
    if (isHovering && event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        hoveredButtonRef.current = {
          x: rect.left + rect.width / 2 - canvasRect.left,
          y: rect.top + rect.height / 2 - canvasRect.top
        };
      }
    } else {
      hoveredButtonRef.current = null;
    }
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

  const handlePortfolioClick = (event: React.MouseEvent) => {
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
        intensity: 8,
        time: 0
      };
    }
    
    // Show portfolio after short delay
    setTimeout(() => {
      setShowPortfolio(true);
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
      <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen transition-all duration-1000 ${showPortfolio ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        {/* Header Text */}
        <div className="text-center space-y-8 mb-16">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-8">
            This site was made by
          </p>
          <h1 className="text-4xl font-mono text-slate-200 font-bold tracking-wide">
            Kaci Bedi
          </h1>
          <blockquote className="max-w-2xl mx-auto text-center">
            <p className="text-base font-mono text-slate-300 leading-relaxed">
              "You are not a drop in the ocean. You are the entire ocean in a drop."
            </p>
            <cite className="block mt-3 text-sm font-mono text-slate-400">— Rumi</cite>
          </blockquote>
        </div>
        
        {/* Social Links */}
        <div className="flex space-x-16 px-8">
          {/* Instagram Button */}
          <button
            data-testid="button-instagram"
            onMouseEnter={(e) => handleButtonHover(true, e)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={(e) => handleButtonClickWithRipple('https://instagram.com/kaciibedi', e)}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                       active:scale-95 active:bg-slate-600/70 transform"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              instagram
            </span>
          </button>

          {/* Portfolio Button */}
          <button
            data-testid="button-portfolio"
            onMouseEnter={(e) => handleButtonHover(true, e)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={handlePortfolioClick}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                       active:scale-95 active:bg-slate-600/70 transform"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              portfolio
            </span>
          </button>

          {/* YouTube Button */}
          <button
            data-testid="button-youtube"
            onMouseEnter={(e) => handleButtonHover(true, e)}
            onMouseLeave={() => handleButtonHover(false)}
            onClick={(e) => handleButtonClickWithRipple('https://youtube.com/@ytkaci', e)}
            className="group relative px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                       hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400
                       active:scale-95 active:bg-slate-600/70 transform"
          >
            <span className="text-sm font-mono text-slate-300 group-hover:text-cyan-200 transition-colors duration-300">
              youtube
            </span>
          </button>
        </div>
      </div>

      {/* Portfolio Timeline View */}
      {showPortfolio && (
        <div className="fixed inset-0 z-20 flex items-center justify-start overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .portfolio-timeline::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <div className="flex space-x-32 px-16 py-8 min-w-full portfolio-timeline animate-fadeIn">
            {/* Timeline Item 1 - BSc Physics */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  2021–2025
                </div>
                <h3 className="text-2xl font-mono text-slate-200 font-bold">
                  BSc Physics
                </h3>
                <h4 className="text-sm font-mono text-slate-300">
                  King's College London
                </h4>
                <p className="text-sm font-mono text-slate-300 leading-relaxed">
                  Moved to London at 18. Engaged deeply with the AI community at KCL, completing two advanced modules from Computer Science. Developed expertise in scientific programming, data visualization, and machine learning. Dissertation: Machine Learning with Quantum Computers — applied quantum mechanics to financial fraud detection.
                </p>
              </div>
            </div>

            {/* Timeline Item 2 - Vizent */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  2023
                </div>
                <h3 className="text-2xl font-mono text-slate-200 font-bold">
                  Vizent Python Library Testing
                </h3>
                <p className="text-sm font-mono text-slate-300 leading-relaxed">
                  Tested and validated the Vizent library for entropy and complexity visualization. Supported analytical projects for UK National Grid and Transport for London, ensuring precision in system complexity assessment.
                </p>
                <a 
                  href="https://pypi.org/project/vizent" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
                  data-testid="link-vizent"
                >
                  pypi.org/project/vizent →
                </a>
              </div>
            </div>

            {/* Timeline Item 3 - DJ Society */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  2023
                </div>
                <h3 className="text-2xl font-mono text-slate-200 font-bold">
                  President, King's College London DJ Society
                </h3>
                <p className="text-sm font-mono text-slate-300 leading-relaxed">
                  Led 800+ members. Organized events for 1,000+ attendees. Raised £4,000+ for charity.
                </p>
                <a 
                  href="https://instagram.com/kaciibedi" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
                  data-testid="link-djsociety"
                >
                  Instagram →
                </a>
              </div>
            </div>

            {/* Timeline Item 4 - Digital Content */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  2025
                </div>
                <h3 className="text-2xl font-mono text-slate-200 font-bold">
                  Digital Content & Science Communication
                </h3>
                <p className="text-sm font-mono text-slate-300 leading-relaxed">
                  Produced educational content on physics, AI, and growth. 2 million+ views in one month across Instagram and TikTok. 4,000+ organic followers.
                </p>
                <a 
                  href="https://youtube.com/@ytkaci" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
                  data-testid="link-content"
                >
                  Watch →
                </a>
              </div>
            </div>

            {/* Timeline Item 5 - Rota System */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  2025
                </div>
                <h3 className="text-2xl font-mono text-slate-200 font-bold">
                  Full-Stack Rota System Developer
                </h3>
                <h4 className="text-sm font-mono text-slate-300">
                  King's Disability Department
                </h4>
                <p className="text-sm font-mono text-slate-300 leading-relaxed">
                  Built automated shift management system using Power Apps, SharePoint, and Power Automate. Secured university grant funding. Delivered GDPR-compliant solution eliminating manual scheduling.
                </p>
              </div>
            </div>

            {/* Timeline Item 6 - Clarius Living */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  2025
                </div>
                <h3 className="text-2xl font-mono text-slate-200 font-bold">
                  Clarius Living
                </h3>
                <p className="text-sm font-mono text-slate-300 leading-relaxed">
                  Directed social media creative and brand identity. Led 3D product design and rendering for complete catalog.
                </p>
                <a 
                  href="https://clariusliving.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
                  data-testid="link-clarius"
                >
                  clariusliving.com →
                </a>
              </div>
            </div>

            {/* Timeline Item 7 - Naked & Saucy */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  2025
                </div>
                <h3 className="text-2xl font-mono text-slate-200 font-bold">
                  Naked & Saucy
                </h3>
                <p className="text-sm font-mono text-slate-300 leading-relaxed">
                  Developing creative strategy and content direction. Building long-term brand presence through visual storytelling.
                </p>
                <a 
                  href="https://nakedandsaucy.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
                  data-testid="link-nakedandsaucy"
                >
                  nakedandsaucy.com →
                </a>
              </div>
            </div>

            {/* Close Button */}
            <div className="snap-center shrink-0 w-96 flex flex-col justify-center">
              <button
                onClick={() => setShowPortfolio(false)}
                className="px-6 py-3 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm
                           hover:bg-slate-700/60 hover:border-slate-500/70 transition-all duration-300
                           focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                data-testid="button-close-portfolio"
              >
                <span className="text-sm font-mono text-slate-300 hover:text-cyan-200">
                  ← Back to Home
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}