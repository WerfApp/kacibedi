import { useStore } from '../state/useStore';
import { oklchToCSS } from '../lib/colors';

export default function GodModeToggle() {
  const { godMode, setGodMode, nodes, viewState } = useStore();
  
  const rootNode = nodes.find(n => n.id === viewState.rootId);
  const rootColor = rootNode?.color.oklch || { l: 0.7, c: 0.15, h: 220 };
  
  const handleToggle = () => {
    setGodMode(!godMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Don't show if no nodes exist
  if (nodes.length === 0) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-pressed={godMode}
      className="fixed bottom-6 left-6 select-none px-3 py-2 rounded-full bg-slate-200/90 dark:bg-neutral-900/80 text-slate-800 dark:text-neutral-100 backdrop-blur border border-slate-300/50 dark:border-white/10 hover:bg-slate-300/90 dark:hover:bg-neutral-800 transition-all duration-200 z-30 flex items-center space-x-2"
    >
      <div 
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          godMode ? 'animate-pulse' : ''
        }`}
        style={{ 
          backgroundColor: godMode ? oklchToCSS(rootColor) : 'rgba(255,255,255,0.3)' 
        }}
      />
      <span className="text-sm font-medium">God Mode</span>
    </button>
  );
}