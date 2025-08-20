import { useStore } from '../state/useStore';
import { oklchToCSS } from '../lib/colors';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb() {
  const { viewState, nodes, setCurrentRoot } = useStore();
  
  // Don't render breadcrumb if no nodes exist
  if (nodes.length === 0 || !viewState.rootId) {
    return null;
  }
  
  const rootNode = nodes.find(n => n.id === viewState.rootId);
  const rootColor = rootNode?.color.oklch || { l: 0.7, c: 0.15, h: 220 };

  const handleBreadcrumbClick = async (index: number) => {
    if (index < viewState.breadcrumb.length - 1) {
      // Navigate to a parent node
      let currentId = viewState.rootId;
      let current = nodes.find(n => n.id === currentId);
      
      // Walk up the tree to find the target ancestor
      const targetDepth = viewState.breadcrumb.length - 1 - index;
      for (let i = 0; i < targetDepth && current?.parentId; i++) {
        const parentId = current.parentId;
        const parentNode = nodes.find(n => n.id === parentId);
        if (!parentNode) {
          // Parent node doesn't exist, stop navigation
          console.warn(`Parent node not found: ${parentId}`);
          return;
        }
        currentId = parentId;
        current = parentNode;
      }
      
      // Double-check that the target node still exists
      if (current && nodes.find(n => n.id === current.id)) {
        await setCurrentRoot(current.id);
      }
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
      <nav className="flex items-center space-x-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 text-slate-800 dark:text-white/90">
        {/* Root color indicator */}
        <div 
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: oklchToCSS(rootColor) }}
        />
        
        {/* Breadcrumb items */}
        {viewState.breadcrumb.map((title, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-slate-600 dark:text-white/60" />
            )}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={`text-sm font-medium transition-colors ${
                index === viewState.breadcrumb.length - 1
                  ? 'text-slate-800 dark:text-white cursor-default'
                  : 'text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white cursor-pointer'
              }`}
              disabled={index === viewState.breadcrumb.length - 1}
            >
              {title}
            </button>
          </div>
        ))}
      </nav>
    </div>
  );
}
