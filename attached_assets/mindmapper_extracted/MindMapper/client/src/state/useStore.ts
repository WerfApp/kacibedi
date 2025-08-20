import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Node, AppSettings, Session, ViewState, LinkMode, Command } from '../types';
import { db, debouncedSave } from '../db/db';
import { generateNodeColors, generateRootColor, generateChildColor } from '../lib/colors';
import Fuse from 'fuse.js';

// God Mode types
export interface GodLayoutPosition {
  x: number;
  y: number;
  z: number;
  depth: number;
  theta: number;
  radius: number;
}

export type GodLayout = Map<string, GodLayoutPosition>;

export interface CameraPose {
  pos: [number, number, number];
  target: [number, number, number];
}

interface StoreState {
  // Data
  nodes: Node[];
  settings: AppSettings | null;
  session: Session | null;
  
  // UI State
  viewState: ViewState;
  linkMode: LinkMode;
  commandPaletteOpen: boolean;
  helpOpen: boolean;
  inlineEditorOpen: boolean;
  editingNodeId: string | null;
  selectedNode: Node | null;
  
  // Layout
  layoutWorker: Worker | null;
  autoLayoutEnabled: boolean;
  
  // God Mode
  godMode: boolean;
  godLayout: GodLayout | null;
  godWorker: Worker | null;
  lastCameraPose: CameraPose | null;
  
  // Search
  searchFuse: Fuse<Node> | null;
  
  // Actions
  initializeStore: () => Promise<void>;
  setCurrentRoot: (nodeId: string) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;
  createNode: (title: string, parentId?: string, body?: string) => Promise<void>;
  updateNode: (nodeId: string, updates: Partial<Node>) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  createLink: (sourceId: string, targetId: string) => Promise<void>;
  removeLink: (sourceId: string, targetId: string) => Promise<void>;
  
  // UI Actions
  toggleCommandPalette: () => void;
  toggleHelp: () => void;
  openInlineEditor: (nodeId: string) => void;
  closeInlineEditor: () => void;
  toggleLinkMode: (sourceId?: string) => void;
  goToParent: () => Promise<void>;
  
  // Layout Actions
  initializeLayout: () => void;
  updateNodePositions: (positions: Record<string, { x: number; y: number; z: number }>) => void;
  toggleAutoLayout: () => void;
  
  // God Mode Actions
  setGodMode: (enabled: boolean) => void;
  setGodLayout: (layout: GodLayout | null) => void;
  setLastCameraPose: (pose: CameraPose | null) => void;
  
  // Import/Export Actions
  exportMindMap: (name: string, description?: string) => Promise<void>;
  importMindMap: (data: import('../types').MindMapExport) => Promise<void>;
  clearAndImport: (data: import('../types').MindMapExport) => Promise<void>;
  
  // Search
  searchNodes: (query: string) => Node[];
  
  // Color management
  recolorSubtree: (rootId: string) => Promise<void>;
}

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    nodes: [],
    settings: null,
    session: null,
    
    viewState: {
      rootId: '',
      selectedNodeId: null,
      hoveredNodeId: null,
      breadcrumb: [],
      cameraPosition: { x: 5, y: 5, z: 5 },
      cameraTarget: { x: 0, y: 0, z: 0 }
    },
    
    linkMode: { active: false },
    commandPaletteOpen: false,
    helpOpen: false,
    inlineEditorOpen: false,
    editingNodeId: null,
    selectedNode: null,
    
    layoutWorker: null,
    autoLayoutEnabled: true,
    
    // God Mode initial state
    godMode: false,
    godLayout: null,
    godWorker: null,
    lastCameraPose: null,
    
    searchFuse: null,
    
    // Initialize store and load data
    initializeStore: async () => {
      try {
        let nodes = await db.nodes.toArray();
        const settings = await db.settings.toArray();
        let sessions = await db.sessions.toArray();
        
        // Force clear any session with the problematic root ID
        const problematicId = 'root-1755599627208';
        const hasProblematicSession = sessions.find(s => s.currentRootId === problematicId);
        if (hasProblematicSession) {
          console.warn(`Found problematic session with ID ${problematicId}, clearing all sessions...`);
          await db.sessions.clear();
          sessions = [];
        }
        
        // Filter out any invalid nodes
        nodes = nodes.filter(n => n && n.id && n.title);
        
        let rootNode = nodes.find(n => n.parentId === null);
        
        // If no root node exists, create one
        if (!rootNode) {
          const rootColor = generateRootColor();
          const newRootNode: Node = {
            id: `root-${Date.now()}`,
            title: 'My Mind Map',
            body: 'Welcome to your mind map! Double-click nodes to explore deeper.',
            parentId: null,
            position: { x: 0, y: 0, z: 0 },
            color: { oklch: rootColor },
            links: [],
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          await db.nodes.add(newRootNode);
          nodes.push(newRootNode);
          rootNode = newRootNode;
        }
        
        // Clean up any invalid session references
        sessions = sessions.filter(s => {
          if (s.currentRootId) {
            return nodes.find(n => n && n.id === s.currentRootId);
          }
          return true;
        });
        
        // Update database with cleaned sessions
        await db.sessions.clear();
        if (sessions.length > 0) {
          await db.sessions.bulkAdd(sessions);
        }
        
        const currentSession = sessions.find(s => s.id === 'default') || sessions[0];
        let validRootId = rootNode!.id;
        
        // Ensure the current root ID is valid
        if (currentSession?.currentRootId) {
          const sessionRoot = nodes.find(n => n.id === currentSession.currentRootId);
          if (sessionRoot) {
            validRootId = currentSession.currentRootId;
          } else {
            // Clear invalid root ID from session to prevent future errors
            console.warn(`Invalid session root ID: ${currentSession.currentRootId}. Resetting to default root.`);
            const updatedSession = {
              ...currentSession,
              currentRootId: validRootId,
              lastAccessed: Date.now()
            };
            await db.sessions.put(updatedSession);
          }
        }
        
        const breadcrumb = await buildBreadcrumb(validRootId, nodes);
        
        set({
          nodes,
          settings: settings[0] || null,
          session: currentSession || null,
          viewState: {
            rootId: validRootId,
            selectedNodeId: null,
            hoveredNodeId: null,
            breadcrumb,
            cameraPosition: currentSession?.cameraPosition || { x: 5, y: 5, z: 5 },
            cameraTarget: currentSession?.cameraTarget || { x: 0, y: 0, z: 0 }
          },
          searchFuse: new Fuse(nodes, {
            keys: ['title', 'body', 'tags'],
            threshold: 0.3
          })
        });
        
        get().initializeLayout();
      } catch (error) {
        console.error('Store initialization failed:', error);
        throw error;
      }
    },
    
    setCurrentRoot: async (nodeId: string) => {
      try {
        const { nodes, session } = get();
        
        // Check if the node exists before setting it as root
        const targetNode = nodes.find(n => n.id === nodeId);
        if (!targetNode) {
          console.warn(`Node not found: ${nodeId}. Skipping navigation.`);
          return;
        }
        
        const breadcrumb = await buildBreadcrumb(nodeId, nodes);
        
        set(state => ({
          viewState: {
            ...state.viewState,
            rootId: nodeId,
            selectedNodeId: null,
            breadcrumb
          }
        }));
        
        // Update session
        if (session) {
          const updatedSession = {
            ...session,
            currentRootId: nodeId,
            lastAccessed: Date.now()
          };
          
          await db.sessions.put(updatedSession);
          set({ session: updatedSession });
        }
        
        get().initializeLayout();
      } catch (error) {
        console.error('Error setting current root:', error);
      }
    },
    
    selectNode: (nodeId: string | null) => {
      const { nodes } = get();
      const selectedNode = nodeId ? nodes.find(n => n.id === nodeId) || null : null;
      
      set(state => ({
        viewState: {
          ...state.viewState,
          selectedNodeId: nodeId
        },
        selectedNode
      }));
    },
    
    hoverNode: (nodeId: string | null) => {
      set(state => ({
        viewState: {
          ...state.viewState,
          hoveredNodeId: nodeId
        }
      }));
    },
    
    createNode: async (title: string, parentId, body) => {
      const { nodes, viewState } = get();
      const now = Date.now();
      
      // If no nodes exist, create the first node as root
      if (nodes.length === 0) {
        const rootColor = generateRootColor();
        const newRootNode: Node = {
          id: `root-${now}`,
          title,
          body,
          parentId: null,
          position: { x: 0, y: 0, z: 0 },
          color: { oklch: rootColor },
          links: [],
          tags: [],
          createdAt: now,
          updatedAt: now
        };
        
        await db.nodes.add(newRootNode);
        
        const breadcrumb = await buildBreadcrumb(newRootNode.id, [newRootNode]);
        
        set({
          nodes: [newRootNode],
          viewState: {
            ...viewState,
            rootId: newRootNode.id,
            selectedNodeId: null,
            breadcrumb
          },
          searchFuse: new Fuse([newRootNode], {
            keys: ['title', 'body', 'tags'],
            threshold: 0.3
          })
        });
        
        get().initializeLayout();
        return;
      }
      
      // Regular node creation as child of specified parent or current root
      const effectiveParentId = parentId || viewState.rootId;
      const parentNode = nodes.find(n => n.id === effectiveParentId);
      const parentColor = parentNode?.color.oklch || { l: 0.7, c: 0.15, h: 220 };
      const tempNode: Node = { 
        id: 'temp', 
        parentId: effectiveParentId, 
        title, 
        body,
        position: { x: 0, y: 0, z: 0 },
        color: { oklch: parentColor },
        createdAt: now,
        updatedAt: now,
        links: [],
        tags: []
      };
      const childColors = generateNodeColors([...nodes, tempNode], parentColor.h);
      
      const newNode: Node = {
        id: `node-${now}-${Math.random().toString(36).substr(2, 9)}`,
        parentId: effectiveParentId,
        title,
        body,
        position: { x: 0, y: 0, z: 0 },
        color: { oklch: childColors['temp'] || parentColor },
        createdAt: now,
        updatedAt: now,
        links: [],
        tags: []
      };
      
      await db.nodes.add(newNode);
      
      set(state => ({
        nodes: [...state.nodes, newNode],
        searchFuse: new Fuse([...state.nodes, newNode], {
          keys: ['title', 'body', 'tags'],
          threshold: 0.3
        })
      }));
      
      // Update both normal layout and God Mode layout if active
      const state = get();
      get().initializeLayout();
      
      // If God Mode is active, also update the God Mode layout
      if (state.godMode && state.godWorker) {
        state.godWorker.postMessage({
          type: 'GOD_LAYOUT_REQUEST',
          rootId: state.viewState.rootId,
          nodes: [...state.nodes, newNode]
        });
      }
    },
    
    updateNode: async (nodeId: string, updates: Partial<Node>) => {
      const { viewState } = get();
      const updatedNode = { ...updates, id: nodeId, updatedAt: Date.now() };
      
      debouncedSave(async () => {
        await db.nodes.update(nodeId, updatedNode);
      });
      
      const updatedNodes = get().nodes.map(n => 
        n.id === nodeId ? { ...n, ...updatedNode } : n
      );
      
      // If the updated node is in the current breadcrumb path, rebuild breadcrumb
      const needsBreadcrumbUpdate = viewState.breadcrumb.some(() => {
        // Check if the updated node affects the current path
        let currentId: string | null = viewState.rootId;
        while (currentId) {
          if (currentId === nodeId) return true;
          const node = updatedNodes.find(n => n.id === currentId);
          currentId = node?.parentId || null;
        }
        return false;
      });
      
      let newBreadcrumb = viewState.breadcrumb;
      if (needsBreadcrumbUpdate) {
        newBreadcrumb = await buildBreadcrumb(viewState.rootId, updatedNodes);
      }
      
      set(state => ({
        nodes: updatedNodes,
        viewState: {
          ...state.viewState,
          breadcrumb: newBreadcrumb
        },
        searchFuse: new Fuse(updatedNodes, {
          keys: ['title', 'body', 'tags'],
          threshold: 0.3
        })
      }));
    },
    
    deleteNode: async (nodeId: string) => {
      const { nodes, viewState } = get();
      const nodeToDelete = nodes.find(n => n.id === nodeId);
      
      // If deleting the root node (no parent), clear everything
      if (nodeToDelete && nodeToDelete.parentId === null) {
        // Remove all nodes
        await db.nodes.clear();
        
        set({
          nodes: [],
          viewState: {
            ...viewState,
            rootId: '',
            selectedNodeId: null,
            breadcrumb: []
          },
          searchFuse: new Fuse([], {
            keys: ['title', 'body', 'tags'],
            threshold: 0.3
          })
        });
        
        return;
      }
      
      // Find all descendants for regular node deletion
      const toDelete = new Set([nodeId]);
      const findDescendants = (id: string) => {
        const children = nodes.filter(n => n.parentId === id);
        children.forEach(child => {
          toDelete.add(child.id);
          findDescendants(child.id);
        });
      };
      
      findDescendants(nodeId);
      
      // Remove from database
      await db.nodes.bulkDelete(Array.from(toDelete));
      
      const remainingNodes = nodes.filter(n => !toDelete.has(n.id));
      
      set(state => ({
        nodes: remainingNodes,
        viewState: {
          ...state.viewState,
          selectedNodeId: state.viewState.selectedNodeId === nodeId ? null : state.viewState.selectedNodeId
        },
        searchFuse: new Fuse(remainingNodes, {
          keys: ['title', 'body', 'tags'],
          threshold: 0.3
        })
      }));
      
      get().initializeLayout();
    },
    
    createLink: async (sourceId: string, targetId: string) => {
      const { nodes } = get();
      const sourceNode = nodes.find(n => n.id === sourceId);
      
      if (sourceNode && !sourceNode.links.includes(targetId)) {
        const updatedLinks = [...sourceNode.links, targetId];
        await get().updateNode(sourceId, { links: updatedLinks });
        get().initializeLayout();
      }
    },
    
    removeLink: async (sourceId: string, targetId: string) => {
      const { nodes } = get();
      const sourceNode = nodes.find(n => n.id === sourceId);
      
      if (sourceNode) {
        const updatedLinks = sourceNode.links.filter(id => id !== targetId);
        await get().updateNode(sourceId, { links: updatedLinks });
        get().initializeLayout();
      }
    },
    
    // UI Actions
    toggleCommandPalette: () => {
      set(state => ({ commandPaletteOpen: !state.commandPaletteOpen }));
    },
    
    toggleHelp: () => {
      set(state => ({ helpOpen: !state.helpOpen }));
    },
    
    openInlineEditor: (nodeId: string) => {
      set({
        inlineEditorOpen: true,
        editingNodeId: nodeId
      });
    },
    
    closeInlineEditor: () => {
      set({
        inlineEditorOpen: false,
        editingNodeId: null
      });
    },
    
    toggleLinkMode: (sourceId?: string) => {
      set(state => ({
        linkMode: {
          active: !state.linkMode.active,
          sourceNodeId: state.linkMode.active ? undefined : sourceId
        }
      }));
    },
    
    goToParent: async () => {
      const { nodes, viewState } = get();
      const currentRoot = nodes.find(n => n.id === viewState.rootId);
      
      if (currentRoot?.parentId) {
        await get().setCurrentRoot(currentRoot.parentId);
      }
    },
    
    // Layout Actions
    initializeLayout: () => {
      const { nodes, viewState, layoutWorker, autoLayoutEnabled } = get();
      
      if (!autoLayoutEnabled) return;
      
      const visibleNodes = getVisibleNodes(nodes, viewState.rootId);
      const links = buildLinks(visibleNodes);
      
      if (layoutWorker) {
        layoutWorker.postMessage({
          type: 'init',
          nodes: visibleNodes,
          links
        });
      } else {
        // Initialize worker
        try {
          const worker = new Worker(
            new URL('../workers/layout.ts', import.meta.url),
            { type: 'module' }
          );
          
          worker.onmessage = (event) => {
            const { type, positions } = event.data;
            if (type === 'result' && positions) {
              get().updateNodePositions(positions);
            }
          };
          
          worker.postMessage({
            type: 'init',
            nodes: visibleNodes,
            links
          });
          
          set({ layoutWorker: worker });
        } catch (error) {
          console.error('Failed to initialize layout worker:', error);
        }
      }
    },
    
    updateNodePositions: (positions: Record<string, { x: number; y: number; z: number }>) => {
      set(state => ({
        nodes: state.nodes.map(node => ({
          ...node,
          position: positions[node.id] || node.position
        }))
      }));
    },
    
    toggleAutoLayout: () => {
      set(state => {
        const newEnabled = !state.autoLayoutEnabled;
        
        if (state.layoutWorker) {
          if (newEnabled) {
            get().initializeLayout();
          } else {
            state.layoutWorker.postMessage({ type: 'stop' });
          }
        }
        
        return { autoLayoutEnabled: newEnabled };
      });
    },
    


    // God Mode Actions
    setGodMode: (enabled: boolean) => {
      const { nodes, viewState, godWorker } = get();
      
      if (enabled && nodes.length > 0) {
        // Request God layout computation
        if (!godWorker) {
          try {
            const worker = new Worker(
              new URL('../workers/godLayout.ts', import.meta.url),
              { type: 'module' }
            );
            
            worker.onmessage = (event) => {
              const { type, positions, bounds } = event.data;
              if (type === 'GOD_LAYOUT_RESULT') {
                const layout = new Map(Object.entries(positions)) as GodLayout;
                get().setGodLayout(layout);
              } else if (type === 'GOD_LAYOUT_ERROR') {
                console.error('God layout error:', event.data.error);
                set({ godMode: false });
              }
            };
            
            set({ godWorker: worker });
            
            worker.postMessage({
              type: 'GOD_LAYOUT_REQUEST',
              rootId: viewState.rootId,
              nodes: nodes
            });
          } catch (error) {
            console.error('Failed to initialize God layout worker:', error);
            return;
          }
        } else {
          godWorker.postMessage({
            type: 'GOD_LAYOUT_REQUEST',
            rootId: viewState.rootId,
            nodes: nodes
          });
        }
      }
      
      set({ godMode: enabled });
      
      if (!enabled) {
        // Clear God layout when disabling
        set({ godLayout: null });
      }
    },

    setGodLayout: (layout: GodLayout | null) => {
      set({ godLayout: layout });
    },

    setLastCameraPose: (pose: CameraPose | null) => {
      set({ lastCameraPose: pose });
    },

    // Import/Export functions
    exportMindMap: async (name: string, description?: string) => {
      const { nodes, viewState } = get();
      
      if (nodes.length === 0) {
        throw new Error('No nodes to export');
      }

      const exportData: import('../types').MindMapExport = {
        name,
        description,
        exportedAt: Date.now(),
        version: '1.0.0',
        nodes,
        rootId: viewState.rootId,
        metadata: {
          nodeCount: nodes.length,
          createdAt: Math.min(...nodes.map(n => n.createdAt)),
          lastModified: Math.max(...nodes.map(n => n.updatedAt))
        }
      };

      // Create and download the file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    importMindMap: async (data: import('../types').MindMapExport) => {
      // Validate the data structure
      if (!data.nodes || !Array.isArray(data.nodes) || !data.rootId) {
        throw new Error('Invalid mind map data');
      }

      // Merge nodes with existing ones (avoiding ID conflicts)
      const { nodes: currentNodes } = get();
      const existingIds = new Set(currentNodes.map(n => n.id));
      
      // Filter out nodes with conflicting IDs
      const newNodes = data.nodes.filter(node => !existingIds.has(node.id));
      
      if (newNodes.length === 0) {
        throw new Error('All nodes in the import already exist');
      }

      // Add new nodes to database and state
      for (const node of newNodes) {
        await db.nodes.add(node);
      }

      set(state => ({
        nodes: [...state.nodes, ...newNodes],
        searchFuse: new Fuse([...state.nodes, ...newNodes], {
          keys: ['title', 'body', 'tags'],
          threshold: 0.3
        })
      }));

      get().initializeLayout();
    },

    clearAndImport: async (data: import('../types').MindMapExport) => {
      // Validate the data structure
      if (!data.nodes || !Array.isArray(data.nodes) || !data.rootId) {
        throw new Error('Invalid mind map data');
      }

      // Clear existing data
      await db.nodes.clear();
      
      // Add imported nodes
      for (const node of data.nodes) {
        await db.nodes.add(node);
      }

      // Update state
      set({
        nodes: data.nodes,
        viewState: {
          ...get().viewState,
          rootId: data.rootId,
          selectedNodeId: null,
          hoveredNodeId: null,
          breadcrumb: []
        },
        searchFuse: new Fuse(data.nodes, {
          keys: ['title', 'body', 'tags'],
          threshold: 0.3
        }),
        selectedNode: null,
        godMode: false,
        godLayout: null
      });

      // Initialize layout with new data
      get().initializeLayout();
      
      // Set current root to the imported root
      await get().setCurrentRoot(data.rootId);
    },

    searchNodes: (query: string) => {
      const { searchFuse } = get();
      if (!searchFuse || !query.trim()) return [];
      
      const results = searchFuse.search(query.trim());
      return results.map(result => result.item);
    },

    recolorSubtree: async (rootId: string) => {
      const { nodes } = get();
      const rootNode = nodes.find(n => n.id === rootId);
      if (!rootNode) return;

      // Generate new colors for the subtree
      const subtreeNodes = nodes.filter(node => {
        if (node.id === rootId) return true;
        
        let current = node;
        while (current.parentId) {
          const parent = nodes.find(n => n.id === current.parentId);
          if (!parent) break;
          if (parent.id === rootId) return true;
          current = parent;
        }
        return false;
      });

      // Assign new colors
      const updatedNodes = subtreeNodes.map(node => {
        if (node.id === rootId) {
          // Generate new root color
          const newColor = generateRootColor();
          return { ...node, color: { oklch: newColor }, updatedAt: Date.now() };
        } else {
          // Generate child colors based on hierarchy
          const parent = nodes.find(n => n.id === node.parentId);
          if (parent) {
            const siblingIndex = nodes.filter(n => n.parentId === parent.id).indexOf(node);
            const newColor = generateChildColor(parent.color.oklch, siblingIndex + 1);
            return { ...node, color: { oklch: newColor }, updatedAt: Date.now() };
          }
          return node;
        }
      });

      // Update database and state
      for (const node of updatedNodes) {
        await db.nodes.put(node);
      }

      set(state => ({
        nodes: state.nodes.map(node => {
          const updated = updatedNodes.find(u => u.id === node.id);
          return updated || node;
        })
      }));
    }
  }))
);

// Helper functions
async function buildBreadcrumb(nodeId: string, nodes: Node[]): Promise<string[]> {
  const breadcrumb: string[] = [];
  let currentId: string | null = nodeId;
  
  while (currentId) {
    const node = nodes.find(n => n.id === currentId);
    if (node) {
      breadcrumb.unshift(node.title);
      currentId = node.parentId;
    } else {
      break;
    }
  }
  
  return breadcrumb;
}

function getVisibleNodes(nodes: Node[], rootId: string): Node[] {
  const visible = new Set<string>();
  
  // Add root
  visible.add(rootId);
  
  // Add immediate children
  nodes.filter(n => n.parentId === rootId).forEach(child => {
    visible.add(child.id);
  });
  
  // Add linked neighbors
  nodes.forEach(node => {
    if (visible.has(node.id)) {
      node.links.forEach(linkId => {
        visible.add(linkId);
      });
    }
  });
  
  return nodes.filter(n => visible.has(n.id));
}

function buildLinks(nodes: Node[]): Array<{ source: string; target: string }> {
  const links: Array<{ source: string; target: string }> = [];
  
  nodes.forEach(node => {
    // Parent-child links
    if (node.parentId) {
      links.push({ source: node.parentId, target: node.id });
    }
    
    // User-created links
    node.links.forEach(linkId => {
      links.push({ source: node.id, target: linkId });
    });
  });
  
  return links;
}

function getSubtreeNodes(nodes: Node[], rootId: string): Node[] {
  const subtree = new Set<string>();
  
  const addSubtree = (nodeId: string) => {
    subtree.add(nodeId);
    nodes.filter(n => n.parentId === nodeId).forEach(child => {
      addSubtree(child.id);
    });
  };
  
  addSubtree(rootId);
  return nodes.filter(n => subtree.has(n.id));
}
