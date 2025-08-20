import { useState } from 'react';
import { useStore } from '../state/useStore';
import { Plus, MoreHorizontal, X } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

export default function MobileControls() {
  const isMobile = useIsMobile();
  const { toggleCommandPalette, createNode, viewState } = useStore();
  const [showContextMenu, setShowContextMenu] = useState(false);

  if (!isMobile) {
    return null;
  }

  const handleCreateNode = () => {
    const position = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4
    };
    createNode('New Node', position);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-20 flex flex-col space-y-3">
        <button
          onClick={toggleCommandPalette}
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleCreateNode}
          className="w-12 h-12 rounded-full bg-green-600 text-white shadow-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Context Sheet */}
      {showContextMenu && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowContextMenu(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-4">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto" />
              
              <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white">
                {viewState.selectedNodeId ? 'Node Actions' : 'Quick Actions'}
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleCreateNode();
                    setShowContextMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-900 dark:text-white">Create Node</span>
                </button>
                
                <button
                  onClick={() => {
                    toggleCommandPalette();
                    setShowContextMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-gray-900 dark:text-white">All Commands</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
