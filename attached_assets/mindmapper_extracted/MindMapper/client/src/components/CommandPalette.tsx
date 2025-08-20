import { useEffect, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { useStore } from '../state/useStore';
import { Command } from '../types';
import { cn } from '../lib/utils';
import { 
  Plus, 
  Edit, 
  Link, 
  Palette, 
  ToggleLeft, 
  Download, 
  Upload, 
  Search,
  ArrowLeft,
  Trash2
} from 'lucide-react';

export default function CommandPalette() {
  const {
    commandPaletteOpen,
    toggleCommandPalette,
    viewState,
    nodes,
    createNode,
    openInlineEditor,
    toggleLinkMode,
    recolorSubtree,
    toggleAutoLayout,
    exportMindMap,
    importMindMap,
    setCurrentRoot,
    goToParent,
    deleteNode,
    searchNodes
  } = useStore();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (search.trim()) {
      const results = searchNodes(search);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [search, searchNodes]);

  const commands: Command[] = [
    {
      id: 'new-node',
      label: 'New node',
      description: 'Create a new node at cursor',
      icon: 'plus',
      shortcut: 'Space',
      action: () => {
        const position = {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4,
          z: (Math.random() - 0.5) * 4
        };
        createNode('New Node', viewState.rootId);
        toggleCommandPalette();
      }
    },
    {
      id: 'rename',
      label: 'Rename',
      description: 'Edit selected node title',
      icon: 'edit',
      shortcut: 'E',
      action: () => {
        if (viewState.selectedNodeId) {
          openInlineEditor(viewState.selectedNodeId);
          toggleCommandPalette();
        }
      }
    },
    {
      id: 'link',
      label: 'Link to...',
      description: 'Connect to another node',
      icon: 'link',
      shortcut: 'L',
      action: () => {
        if (viewState.selectedNodeId) {
          toggleLinkMode(viewState.selectedNodeId);
          toggleCommandPalette();
        }
      }
    },
    {
      id: 'recolor',
      label: 'Recolor subtree',
      description: 'Change color theme',
      icon: 'palette',
      shortcut: 'C',
      action: () => {
        if (viewState.selectedNodeId) {
          recolorSubtree(viewState.selectedNodeId);
          toggleCommandPalette();
        }
      }
    },
    {
      id: 'toggle-layout',
      label: 'Toggle layout',
      description: 'Enable/disable auto-layout',
      icon: 'toggle',
      shortcut: 'G',
      action: () => {
        toggleAutoLayout();
        toggleCommandPalette();
      }
    },
    {
      id: 'go-back',
      label: 'Go back',
      description: 'Navigate to parent',
      icon: 'arrow-left',
      shortcut: 'Backspace',
      action: () => {
        goToParent();
        toggleCommandPalette();
      }
    },
    {
      id: 'delete',
      label: 'Delete node',
      description: 'Remove selected node and children',
      icon: 'trash',
      shortcut: 'Delete',
      action: () => {
        if (viewState.selectedNodeId && confirm('Delete this node and all its children?')) {
          deleteNode(viewState.selectedNodeId);
          toggleCommandPalette();
        }
      }
    },
    {
      id: 'export',
      label: 'Export JSON',
      description: 'Download mind map data',
      icon: 'download',
      action: async () => {
        try {
          await exportMindMap('mind-map-export', 'Exported mind map data');
          toggleCommandPalette();
        } catch (error) {
          console.error('Export failed:', error);
        }
      }
    },
    {
      id: 'import',
      label: 'Import JSON',
      description: 'Load mind map from file',
      icon: 'upload',
      action: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            try {
              const text = await file.text();
              const data = JSON.parse(text);
              await importMindMap(data);
              toggleCommandPalette();
            } catch (error) {
              alert('Import failed: Invalid file format');
              console.error('Import failed:', error);
            }
          }
        };
        input.click();
      }
    }
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      plus: Plus,
      edit: Edit,
      link: Link,
      palette: Palette,
      toggle: ToggleLeft,
      download: Download,
      upload: Upload,
      search: Search,
      'arrow-left': ArrowLeft,
      trash: Trash2
    };
    
    return icons[iconName] || Plus;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggleCommandPalette();
      }
      
      if (event.key === 'Escape' && commandPaletteOpen) {
        toggleCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, toggleCommandPalette]);

  if (!commandPaletteOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <CommandPrimitive className="w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <CommandPrimitive.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search or type a command..."
                className="w-full pl-10 pr-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none text-sm"
              />
              <Search className="absolute left-7 top-7 h-4 w-4 text-gray-400" />
            </div>

            <CommandPrimitive.List className="max-h-80 overflow-y-auto">
              {search.trim() && (
                <CommandPrimitive.Group heading="Search Results">
                  {searchResults.map((node) => {
                    const IconComponent = getIcon('search');
                    return (
                      <CommandPrimitive.Item
                        key={`search-${node.id}`}
                        onSelect={() => {
                          // Verify node still exists before navigation
                          const targetNode = nodes.find(n => n.id === node.id);
                          if (targetNode) {
                            setCurrentRoot(node.id);
                            toggleCommandPalette();
                          }
                        }}
                        className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                          <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {node.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Jump to node
                          </div>
                        </div>
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              )}

              <CommandPrimitive.Group heading="Actions">
                {commands.map((command) => {
                  const IconComponent = getIcon(command.icon);
                  return (
                    <CommandPrimitive.Item
                      key={command.id}
                      onSelect={command.action}
                      className="flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {command.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {command.description}
                        </div>
                      </div>
                      {command.shortcut && (
                        <kbd className="hidden sm:block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                          {command.shortcut}
                        </kbd>
                      )}
                    </CommandPrimitive.Item>
                  );
                })}
              </CommandPrimitive.Group>
            </CommandPrimitive.List>

            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Use ↑↓ to navigate</span>
                <span>Esc to close</span>
              </div>
            </div>
          </CommandPrimitive>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
        onClick={toggleCommandPalette}
      />
    </div>
  );
}
