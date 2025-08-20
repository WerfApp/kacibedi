import Dexie, { Table } from 'dexie';

export interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  parentId?: string;
  color: string;
  size: number;
  sessionId: string;
  createdAt: number;
  description?: string;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  sessionId: string;
  createdAt: number;
}

export interface Session {
  id: string;
  name: string;
  currentRootId: string;
  createdAt: number;
  lastAccessedAt: number;
}

export interface Settings {
  id: string;
  key: string;
  value: any;
}

export class MindMapDB extends Dexie {
  nodes!: Table<Node>;
  edges!: Table<Edge>;
  sessions!: Table<Session>;
  settings!: Table<Settings>;

  constructor() {
    super('MindMapDB');
    this.version(1).stores({
      nodes: 'id, parentId, sessionId, text, createdAt',
      edges: 'id, from, to, sessionId, createdAt',
      sessions: 'id, name, currentRootId, createdAt, lastAccessedAt',
      settings: 'id, key'
    });
  }
}

export const db = new MindMapDB();

export async function initializeDatabase() {
  try {
    // Check if we have any existing data
    const nodeCount = await db.nodes.count();
    const sessionCount = await db.sessions.count();
    
    if (nodeCount === 0 && sessionCount === 0) {
      // Create a default session with sample data
      const sessionId = 'default-session';
      const rootId = 'root-node-1';
      
      await db.sessions.add({
        id: sessionId,
        name: 'Mind Mapper Demo',
        currentRootId: rootId,
        createdAt: Date.now(),
        lastAccessedAt: Date.now()
      });

      // Create sample nodes
      const sampleNodes: Node[] = [
        {
          id: rootId,
          text: 'Mind Mapper Project',
          x: 0,
          y: 0,
          z: 0,
          color: '#3b82f6',
          size: 1.2,
          sessionId,
          createdAt: Date.now(),
          description: 'A 3D mind mapping tool for visualizing ideas and concepts'
        },
        {
          id: 'child-1',
          text: 'Features',
          x: 3,
          y: 1,
          z: 0,
          parentId: rootId,
          color: '#10b981',
          size: 1,
          sessionId,
          createdAt: Date.now(),
          description: 'Core features of the mind mapping application'
        },
        {
          id: 'child-2',
          text: 'Technology',
          x: -3,
          y: 1,
          z: 0,
          parentId: rootId,
          color: '#8b5cf6',
          size: 1,
          sessionId,
          createdAt: Date.now(),
          description: 'Technologies used in development'
        },
        {
          id: 'child-3',
          text: 'Future Plans',
          x: 0,
          y: -3,
          z: 0,
          parentId: rootId,
          color: '#f59e0b',
          size: 1,
          sessionId,
          createdAt: Date.now(),
          description: 'Planned improvements and new features'
        }
      ];

      await db.nodes.bulkAdd(sampleNodes);

      // Create sample edges
      const sampleEdges: Edge[] = [
        {
          id: 'edge-1',
          from: rootId,
          to: 'child-1',
          sessionId,
          createdAt: Date.now()
        },
        {
          id: 'edge-2',
          from: rootId,
          to: 'child-2',
          sessionId,
          createdAt: Date.now()
        },
        {
          id: 'edge-3',
          from: rootId,
          to: 'child-3',
          sessionId,
          createdAt: Date.now()
        }
      ];

      await db.edges.bulkAdd(sampleEdges);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}