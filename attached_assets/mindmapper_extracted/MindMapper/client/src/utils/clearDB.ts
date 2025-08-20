import { db } from '../db/db';

export async function clearDatabase() {
  try {
    await db.nodes.clear();
    await db.sessions.clear();
    await db.settings.clear();
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Failed to clear database:', error);
  }
}

// Auto-clear if we detect stale data issues
export async function clearStaleData() {
  try {
    const sessions = await db.sessions.toArray();
    const nodes = await db.nodes.toArray();
    
    // Check if any session references non-existent nodes
    for (const session of sessions) {
      if (session.currentRootId) {
        const nodeExists = nodes.find(n => n.id === session.currentRootId);
        if (!nodeExists) {
          console.log('Found stale session data, clearing...');
          await db.sessions.clear();
          break;
        }
      }
    }
  } catch (error) {
    console.error('Failed to clear stale data:', error);
  }
}