import Dexie, { Table } from 'dexie';
import { Node, AppSettings, Session } from '../types';

export class LatticeDB extends Dexie {
  nodes!: Table<Node>;
  settings!: Table<AppSettings>;
  sessions!: Table<Session>;

  constructor() {
    super('LatticeDB');
    
    this.version(1).stores({
      nodes: 'id, parentId, title, createdAt, updatedAt, *tags, *links',
      settings: 'theme',
      sessions: 'id, currentRootId, lastAccessed'
    });
  }
}

export const db = new LatticeDB();

// Initialize default settings
export async function initializeDatabase() {
  // Clear stale session data first
  await clearStaleSessionData();
  
  const existingSettings = await db.settings.toArray();
  
  if (existingSettings.length === 0) {
    await db.settings.add({
      theme: 'dark',
      motionReduced: false,
      performanceCap: {
        nodeLabels: 'hover',
        maxVisibleNodes: 2000,
        edgeThickness: 'normal'
      },
      layoutDefaults: {
        linkStrength: 0.3,
        collisionRadius: 2,
        centerStrength: 0.05
      }
    });
  }

  // Create seed content if no nodes exist
  const existingNodes = await db.nodes.toArray();
  if (existingNodes.length === 0) {
    await createSeedContent();
  }
}

async function clearStaleSessionData() {
  try {
    const sessions = await db.sessions.toArray();
    const nodes = await db.nodes.toArray();
    
    // Check if any session references non-existent nodes
    for (const session of sessions) {
      if (session.currentRootId) {
        const nodeExists = nodes.find(n => n && n.id === session.currentRootId);
        if (!nodeExists) {
          console.log(`Found stale session data with invalid root: ${session.currentRootId}, clearing all sessions...`);
          await db.sessions.clear();
          break;
        }
      }
    }
    
    // Also clear any orphaned sessions that might not have been caught
    const validNodeIds = new Set(nodes.map(n => n.id));
    const staleSessions = sessions.filter(s => s.currentRootId && !validNodeIds.has(s.currentRootId));
    if (staleSessions.length > 0) {
      console.log(`Clearing ${staleSessions.length} additional stale sessions`);
      await db.sessions.clear();
    }
  } catch (error) {
    console.error('Failed to clear stale session data:', error);
    // If clearing fails, try to delete the entire database
    try {
      await db.delete();
      console.log('Database was completely reset due to corruption');
    } catch (deleteError) {
      console.error('Failed to reset database:', deleteError);
    }
  }
}

async function createSeedContent() {
  const now = Date.now();
  const rootId = 'root-' + now;
  
  const seedNodes: Node[] = [
    {
      id: rootId,
      parentId: null,
      title: 'My Map',
      body: 'Welcome to your personal mind mapping space! This is the central hub where all your thoughts, projects, and ideas converge. Use this space to organize your mental landscape and explore connections between different areas of your life.',
      color: { oklch: { l: 0.7, c: 0.15, h: 220 } },
      createdAt: now,
      updatedAt: now,
      links: [],
      tags: ['root', 'central'],
      position: { x: 0, y: 0, z: 0 }
    },
    {
      id: 'ideas-' + now,
      parentId: rootId,
      title: 'Ideas',
      body: 'A collection of creative thoughts, innovative solutions, and brainstorming sessions. This is where inspiration strikes and new concepts are born. Capture those lightning bolt moments and nurture them into something meaningful.',
      color: { oklch: { l: 0.72, c: 0.138, h: 357.508 } },
      createdAt: now,
      updatedAt: now,
      links: [],
      tags: ['creative', 'innovation', 'brainstorming'],
      position: { x: 2, y: 1, z: 0 }
    },
    {
      id: 'reading-' + now,
      parentId: rootId,
      title: 'Reading',
      body: 'Books, articles, research papers, and other materials on your reading list. Track your literary journey, capture key insights, and build your knowledge base through continuous learning.',
      color: { oklch: { l: 0.68, c: 0.127, h: 135.016 } },
      createdAt: now,
      updatedAt: now,
      links: [],
      tags: ['books', 'learning', 'knowledge'],
      position: { x: -2, y: 1, z: 0 }
    },
    {
      id: 'revision-' + now,
      parentId: rootId,
      title: 'Revision',
      body: 'Study materials, exam preparation, and review sessions. Keep track of what needs to be revisited and reinforced. Perfect for academic work and skill development.',
      color: { oklch: { l: 0.74, c: 0.142, h: 272.524 } },
      createdAt: now,
      updatedAt: now,
      links: [],
      tags: ['study', 'review', 'education'],
      position: { x: 0, y: -2, z: 0 }
    },
    // Sample children for Ideas
    {
      id: 'ideas-1-' + now,
      parentId: 'ideas-' + now,
      title: 'App Concepts',
      body: 'Mobile and web application ideas that could solve real-world problems. Focus on user experience, innovative features, and market potential.',
      color: { oklch: { l: 0.70, c: 0.120, h: 45 } },
      createdAt: now,
      updatedAt: now,
      links: [],
      tags: ['apps', 'mobile', 'web'],
      position: { x: 4, y: 2, z: 0 }
    },
    // Sample children for Reading
    {
      id: 'reading-1-' + now,
      parentId: 'reading-' + now,
      title: 'Technical Books',
      body: 'Programming, software architecture, and technology books that will advance your technical skills and understanding of modern development practices.',
      color: { oklch: { l: 0.66, c: 0.115, h: 135 } },
      createdAt: now,
      updatedAt: now,
      links: [],
      tags: ['programming', 'technical', 'skills'],
      position: { x: -4, y: 2, z: 0 }
    },
    {
      id: 'ideas-2-' + now,
      parentId: 'ideas-' + now,
      title: 'Business Ideas',
      color: { oklch: { l: 0.68, c: 0.115, h: 90 } },
      createdAt: now,
      updatedAt: now,
      links: []
    },
    {
      id: 'ideas-3-' + now,
      parentId: 'ideas-' + now,
      title: 'Creative Projects',
      color: { oklch: { l: 0.72, c: 0.125, h: 180 } },
      createdAt: now,
      updatedAt: now,
      links: []
    }
  ];

  await db.nodes.bulkAdd(seedNodes);
  
  // Create initial session
  await db.sessions.add({
    id: 'default',
    currentRootId: rootId,
    cameraPosition: { x: 5, y: 5, z: 5 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    lastAccessed: now
  });
}

export async function exportData(): Promise<string> {
  const nodes = await db.nodes.toArray();
  const settings = await db.settings.toArray();
  const sessions = await db.sessions.toArray();
  
  return JSON.stringify({
    version: '1.0.0',
    timestamp: Date.now(),
    data: {
      nodes,
      settings: settings[0] || null,
      sessions
    }
  }, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.data.nodes) {
      // Clear existing data
      await db.transaction('rw', db.nodes, db.settings, db.sessions, async () => {
        await db.nodes.clear();
        await db.settings.clear();
        await db.sessions.clear();
        
        // Import new data
        await db.nodes.bulkAdd(data.data.nodes);
        
        if (data.data.settings) {
          await db.settings.add(data.data.settings);
        }
        
        if (data.data.sessions && data.data.sessions.length > 0) {
          await db.sessions.bulkAdd(data.data.sessions);
        }
      });
    }
  } catch (error) {
    throw new Error('Failed to import data: Invalid JSON format');
  }
}

// Auto-save helper with debouncing
let saveTimeout: NodeJS.Timeout | null = null;

export function debouncedSave(fn: () => Promise<void>) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(async () => {
    try {
      await fn();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, 500);
}
