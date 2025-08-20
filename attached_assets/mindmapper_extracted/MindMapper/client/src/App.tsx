import { useEffect, useState } from 'react';
import { useStore } from './state/useStore';
import { initializeDatabase } from './db/db';
import { useToast } from './hooks/use-toast';
import EnhancedMindMap from './components/EnhancedMindMap';
import CommandPalette from './components/CommandPalette';
import InlineEditor from './components/InlineEditor';
import Help from './components/Help';
import Breadcrumb from './components/Breadcrumb';
import MobileControls from './components/MobileControls';
import AddFAB from './components/AddFAB';
import GodModeToggle from './components/GodModeToggle';
import ImportExportButton from './components/ImportExportButton';
import AuthGate from './components/AuthGate';
import ThemeToggle from './components/ThemeToggle';
import { Toaster } from './components/ui/toaster';
import { MoreHorizontal } from 'lucide-react';

function App() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { initializeStore, nodes, toggleCommandPalette } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    async function initialize() {
      try {
        // Check authentication status first
        const authStatus = localStorage.getItem('lattice-authenticated');
        setIsAuthenticated(authStatus === 'true');
        
        // Only clear database if reset is specifically needed
        if (localStorage.getItem('lattice-reset-needed')) {
          const { db } = await import('./db/db');
          await db.nodes.clear();
          await db.sessions.clear();
          await db.settings.clear();
          localStorage.removeItem('lattice-reset-needed');
          console.log('Database cleared - loading fresh sample data with descriptions');
        }
        
        // Force clear problematic session on startup and reset if needed
        const { db } = await import('./db/db');
        try {
          const sessions = await db.sessions.toArray();
          const problematicId = 'root-1755599627208';
          if (sessions.find(s => s.currentRootId === problematicId)) {
            console.warn('Clearing all data due to problematic session');
            await db.delete();
            // Reload to start fresh
            window.location.reload();
            return;
          }
        } catch (error) {
          console.warn('Database access error, clearing all data');
          try {
            await db.delete();
            window.location.reload();
            return;
          } catch (deleteError) {
            console.error('Failed to reset database:', deleteError);
          }
        }
        
        await initializeDatabase();
        await initializeStore();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast({
          title: 'Initialization Error',
          description: 'Failed to load the application. Please refresh and try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [initializeStore, toast]);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading Lattice...</p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg">Failed to initialize application</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Main App Content - Always rendered but blurred when not authenticated */}
      <div className={`w-full h-full ${!isAuthenticated ? 'blur-sm pointer-events-none' : ''}`}>
        {/* 3D Scene */}
        <EnhancedMindMap />
        
        {/* UI Overlays */}
        <Breadcrumb />
        
        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <Help />
        </div>
        
        {/* Import/Export Button */}
        <ImportExportButton />
        
        {/* Mobile Controls */}
        <MobileControls />
        

        
        {/* Add Node FAB */}
        <AddFAB />
        
        {/* God Mode Toggle */}
        <GodModeToggle />
        
        {/* Modals and Overlays */}
        <CommandPalette />
        <InlineEditor />
        
        {/* Global Keyboard Shortcuts Handler */}
        <GlobalKeyboardHandler />
      </div>
      
      {/* Authentication Gate */}
      {!isAuthenticated && <AuthGate onAuthenticated={handleAuthenticated} />}
      
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

// Global keyboard shortcuts component
function GlobalKeyboardHandler() {
  const { toggleCommandPalette } = useStore();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggleCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  return null;
}

export default App;
