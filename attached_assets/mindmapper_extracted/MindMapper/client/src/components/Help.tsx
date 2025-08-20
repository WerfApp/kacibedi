import { useStore } from '../state/useStore';
import { X, HelpCircle } from 'lucide-react';

export default function Help() {
  const { helpOpen, toggleHelp } = useStore();

  const shortcuts = [
    { action: 'Command palette', keys: ['⌘', 'K'] },
    { action: 'Create node', keys: ['Space'] },
    { action: 'Edit node', keys: ['E'] },
    { action: 'Link nodes', keys: ['L'] },
    { action: 'Go back', keys: ['Backspace'] },
    { action: 'Toggle layout', keys: ['G'] },
    { action: 'Recolor', keys: ['C'] },
    { action: 'Select node', keys: ['Click'] },
    { action: 'Drill into node', keys: ['Double-click'] },
    { action: 'Deselect', keys: ['Esc'] }
  ];

  if (!helpOpen) {
    return (
      <button
        onClick={toggleHelp}
        className="w-10 h-10 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm text-slate-800 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-200 flex items-center justify-center"
        aria-label="Show help"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent z-30"
        onClick={toggleHelp}
      />
      
      {/* Help Panel */}
      <div className="fixed top-16 right-4 z-40 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-right-2 duration-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={toggleHelp}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {shortcut.action}
              </span>
              <div className="flex items-center space-x-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Lattice</strong> - Minimal 3D mind maps that drill down like folders
          </p>
        </div>
      </div>
    </>
  );
}
