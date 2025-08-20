import { Link } from 'wouter';
import { useEffect, useState } from 'react';
import { initializeDatabase } from '../db/db';
import { useMindMapStore } from '../state/mindmapper/useStore';
import MindMapCanvas from '../components/mindmapper/MindMapCanvas';

export default function MindMapper() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initializeStore } = useMindMapStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDatabase();
        await initializeStore();
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize Mind Mapper:', err);
        setError('Failed to load Mind Mapper. Please refresh to try again.');
        setIsLoading(false);
      }
    };

    initialize();
  }, [initializeStore]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 font-mono text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-lg text-slate-300 font-mono">Loading Mind Mapper...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 font-mono text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4 text-lg">Error</div>
          <p className="text-slate-300 font-mono mb-4">{error}</p>
          <Link 
            href="/" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-mono text-slate-200 relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
          >
            ← Back to Home
          </Link>
          <h1 className="text-xl font-bold text-slate-200">Mind Mapper</h1>
          <div className="text-xs text-slate-400 font-mono">
            Double-click nodes to focus • Space to add node
          </div>
        </div>
      </nav>

      {/* Main Mind Map Canvas */}
      <div className="pt-16 h-screen">
        <MindMapCanvas />
      </div>

      {/* Floating Info Panel */}
      <div className="fixed bottom-4 right-4 z-40 bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-lg p-4 max-w-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Mind Mapper Project</h3>
        <p className="text-xs text-slate-300 font-mono leading-relaxed mb-3">
          A 3D mind mapping tool built with React, Canvas rendering, and local storage. 
          Create interconnected nodes to visualize your ideas and thoughts.
        </p>
        
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Technology:</span>
            <span className="text-cyan-400">React + Canvas + IndexedDB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Features:</span>
            <span className="text-green-400">Interactive 3D visualization</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Storage:</span>
            <span className="text-blue-400">Local browser database</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-600">
          <div className="text-xs text-slate-400 space-y-1">
            <div><kbd className="bg-slate-700 px-1 rounded">Space</kbd> - Add new node</div>
            <div><kbd className="bg-slate-700 px-1 rounded">Double-click</kbd> - Focus on node</div>
            <div><kbd className="bg-slate-700 px-1 rounded">Click</kbd> - Select node</div>
          </div>
        </div>
      </div>
    </div>
  );
}