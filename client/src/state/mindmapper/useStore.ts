import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { db, Node, Edge, Session } from '../../db/db';

interface ViewState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
}

interface MindMapStore {
  // Data
  nodes: Node[];
  edges: Edge[];
  sessions: Session[];
  currentSession: Session | null;
  
  // View state
  viewState: ViewState;
  
  // UI state
  isCommandPaletteOpen: boolean;
  isInlineEditorOpen: boolean;
  inlineEditorNodeId: string | null;
  
  // Actions
  initializeStore: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createNode: (text: string, position: { x: number; y: number; z: number }, parentId?: string) => Promise<void>;
  updateNode: (nodeId: string, updates: Partial<Node>) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;
  setCurrentRoot: (nodeId: string) => Promise<void>;
  
  // UI actions
  toggleCommandPalette: () => void;
  openInlineEditor: (nodeId: string) => void;
  closeInlineEditor: () => void;
}

const initialViewState: ViewState = {
  selectedNodeId: null,
  hoveredNodeId: null,
  cameraPosition: { x: 5, y: 5, z: 5 },
  cameraTarget: { x: 0, y: 0, z: 0 }
};

export const useMindMapStore = create<MindMapStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    nodes: [],
    edges: [],
    sessions: [],
    currentSession: null,
    viewState: initialViewState,
    isCommandPaletteOpen: false,
    isInlineEditorOpen: false,
    inlineEditorNodeId: null,

    // Initialize store with data from IndexedDB
    initializeStore: async () => {
      try {
        const sessions = await db.sessions.orderBy('lastAccessedAt').reverse().toArray();
        const currentSession = sessions[0] || null;
        
        if (currentSession) {
          const nodes = await db.nodes.where('sessionId').equals(currentSession.id).toArray();
          const edges = await db.edges.where('sessionId').equals(currentSession.id).toArray();
          
          set({
            sessions,
            currentSession,
            nodes,
            edges
          });
        }
      } catch (error) {
        console.error('Failed to initialize store:', error);
      }
    },

    // Load a specific session
    loadSession: async (sessionId: string) => {
      try {
        const session = await db.sessions.get(sessionId);
        if (!session) return;

        const nodes = await db.nodes.where('sessionId').equals(sessionId).toArray();
        const edges = await db.edges.where('sessionId').equals(sessionId).toArray();

        // Update last accessed time
        await db.sessions.update(sessionId, { lastAccessedAt: Date.now() });

        set({
          currentSession: session,
          nodes,
          edges,
          viewState: { ...initialViewState }
        });
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    },

    // Create a new node
    createNode: async (text: string, position: { x: number; y: number; z: number }, parentId?: string) => {
      const { currentSession } = get();
      if (!currentSession) return;

      try {
        const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNode: Node = {
          id: nodeId,
          text,
          x: position.x,
          y: position.y,
          z: position.z,
          parentId,
          color: parentId ? '#64748b' : '#3b82f6',
          size: 1,
          sessionId: currentSession.id,
          createdAt: Date.now()
        };

        await db.nodes.add(newNode);

        // Create edge if there's a parent
        if (parentId) {
          const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newEdge: Edge = {
            id: edgeId,
            from: parentId,
            to: nodeId,
            sessionId: currentSession.id,
            createdAt: Date.now()
          };
          await db.edges.add(newEdge);
          
          set(state => ({
            edges: [...state.edges, newEdge]
          }));
        }

        set(state => ({
          nodes: [...state.nodes, newNode]
        }));
      } catch (error) {
        console.error('Failed to create node:', error);
      }
    },

    // Update node
    updateNode: async (nodeId: string, updates: Partial<Node>) => {
      try {
        await db.nodes.update(nodeId, updates);
        
        set(state => ({
          nodes: state.nodes.map(node => 
            node.id === nodeId ? { ...node, ...updates } : node
          )
        }));
      } catch (error) {
        console.error('Failed to update node:', error);
      }
    },

    // Delete node and its edges
    deleteNode: async (nodeId: string) => {
      try {
        // Delete the node
        await db.nodes.delete(nodeId);
        
        // Delete all edges connected to this node
        const connectedEdges = await db.edges
          .where('from').equals(nodeId)
          .or('to').equals(nodeId)
          .toArray();
        
        for (const edge of connectedEdges) {
          await db.edges.delete(edge.id);
        }

        set(state => ({
          nodes: state.nodes.filter(node => node.id !== nodeId),
          edges: state.edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId),
          viewState: {
            ...state.viewState,
            selectedNodeId: state.viewState.selectedNodeId === nodeId ? null : state.viewState.selectedNodeId
          }
        }));
      } catch (error) {
        console.error('Failed to delete node:', error);
      }
    },

    // Select node
    selectNode: (nodeId: string | null) => {
      set(state => ({
        viewState: {
          ...state.viewState,
          selectedNodeId: nodeId
        }
      }));
    },

    // Hover node
    hoverNode: (nodeId: string | null) => {
      set(state => ({
        viewState: {
          ...state.viewState,
          hoveredNodeId: nodeId
        }
      }));
    },

    // Set current root (focus on a specific node)
    setCurrentRoot: async (nodeId: string) => {
      const { currentSession } = get();
      if (!currentSession) return;

      try {
        await db.sessions.update(currentSession.id, { currentRootId: nodeId });
        
        set(state => ({
          currentSession: {
            ...state.currentSession!,
            currentRootId: nodeId
          },
          viewState: {
            ...state.viewState,
            selectedNodeId: null,
            cameraTarget: { x: 0, y: 0, z: 0 }
          }
        }));
      } catch (error) {
        console.error('Failed to set current root:', error);
      }
    },

    // UI actions
    toggleCommandPalette: () => {
      set(state => ({
        isCommandPaletteOpen: !state.isCommandPaletteOpen
      }));
    },

    openInlineEditor: (nodeId: string) => {
      set({
        isInlineEditorOpen: true,
        inlineEditorNodeId: nodeId
      });
    },

    closeInlineEditor: () => {
      set({
        isInlineEditorOpen: false,
        inlineEditorNodeId: null
      });
    }
  }))
);