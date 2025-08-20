import { Node } from '../types';

export interface GodLayoutPosition {
  x: number;
  y: number;
  z: number;
  depth: number;
  theta: number;
  radius: number;
}

export interface GodLayoutResult {
  positions: Record<string, GodLayoutPosition>;
  bounds: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

interface TreeNode {
  id: string;
  children: TreeNode[];
  leafCount: number;
  size: number;
  depth: number;
}

// Build tree structure from nodes
function buildTree(rootId: string, nodes: Node[]): TreeNode {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const childrenMap = new Map<string, string[]>();
  
  // Build children map
  nodes.forEach(node => {
    if (node.parentId) {
      if (!childrenMap.has(node.parentId)) {
        childrenMap.set(node.parentId, []);
      }
      childrenMap.get(node.parentId)!.push(node.id);
    }
  });

  function buildNode(id: string, depth: number): TreeNode {
    const childIds = childrenMap.get(id) || [];
    const children = childIds
      .sort((a, b) => {
        const nodeA = nodeMap.get(a);
        const nodeB = nodeMap.get(b);
        return (nodeA?.title || '').localeCompare(nodeB?.title || '');
      })
      .map(childId => buildNode(childId, depth + 1));
    
    const leafCount = children.length === 0 ? 1 : children.reduce((sum, child) => sum + child.leafCount, 0);
    const size = 1 + children.reduce((sum, child) => sum + child.size, 0);
    
    return { id, children, leafCount, size, depth };
  }

  return buildNode(rootId, 0);
}

// Compute radial layout
export function computeGodLayout(rootId: string, nodes: Node[]): GodLayoutResult {
  const tree = buildTree(rootId, nodes);
  const positions: Record<string, GodLayoutPosition> = {};
  
  const r0 = 6; // Base radius
  const gamma = 0.95; // Radius scaling factor
  const zStep = 0.15; // Z-spacing between depths
  const minSeparation = 0.002 * Math.PI; // Minimum angular separation
  
  // Calculate radius for each depth
  function getRadius(depth: number): number {
    if (depth === 0) return 0;
    return r0 * Math.pow(depth, gamma);
  }

  // Recursively assign positions
  function assignPositions(node: TreeNode, startAngle: number, endAngle: number) {
    const { id, children, depth } = node;
    const radius = getRadius(depth);
    
    if (children.length === 0) {
      // Leaf node
      const theta = (startAngle + endAngle) / 2;
      const jitter = (Math.random() - 0.5) * 0.1;
      
      positions[id] = {
        x: isFinite(radius * Math.cos(theta)) ? radius * Math.cos(theta) : 0,
        y: isFinite(radius * Math.sin(theta)) ? radius * Math.sin(theta) : 0,
        z: isFinite(depth * zStep + jitter) ? depth * zStep + jitter : 0,
        depth,
        theta,
        radius
      };
      return;
    }

    // Internal node - place at center of sector
    const theta = (startAngle + endAngle) / 2;
    const jitter = (Math.random() - 0.5) * 0.1;
    
    positions[id] = {
      x: isFinite(radius * Math.cos(theta)) ? radius * Math.cos(theta) : 0,
      y: isFinite(radius * Math.sin(theta)) ? radius * Math.sin(theta) : 0,
      z: isFinite(depth * zStep + jitter) ? depth * zStep + jitter : 0,
      depth,
      theta,
      radius
    };

    // Distribute children
    const totalLeafCount = children.reduce((sum, child) => sum + child.leafCount, 0);
    const sectorSpan = endAngle - startAngle;
    
    let currentAngle = startAngle;
    children.forEach((child, index) => {
      const childSpan = Math.max(minSeparation, (child.leafCount / totalLeafCount) * sectorSpan);
      const childEndAngle = currentAngle + childSpan;
      
      // Add small offset to avoid perfect collinearity
      const offset = 0.015 * index;
      assignPositions(child, currentAngle + offset, childEndAngle + offset);
      
      currentAngle = childEndAngle;
    });
  }

  // Start recursive assignment
  assignPositions(tree, 0, 2 * Math.PI);

  // Calculate bounds
  const allPositions = Object.values(positions);
  if (allPositions.length === 0) {
    return {
      positions,
      bounds: { min: [0, 0, 0], max: [0, 0, 0] }
    };
  }

  const xs = allPositions.map(p => p.x);
  const ys = allPositions.map(p => p.y);
  const zs = allPositions.map(p => p.z);

  const bounds = {
    min: [Math.min(...xs), Math.min(...ys), Math.min(...zs)] as [number, number, number],
    max: [Math.max(...xs), Math.max(...ys), Math.max(...zs)] as [number, number, number]
  };

  return { positions, bounds };
}

// Worker message handling
self.onmessage = function(e) {
  const { type, rootId, nodes } = e.data;
  
  if (type === 'GOD_LAYOUT_REQUEST') {
    try {
      const result = computeGodLayout(rootId, nodes);
      self.postMessage({
        type: 'GOD_LAYOUT_RESULT',
        ...result
      });
    } catch (error) {
      self.postMessage({
        type: 'GOD_LAYOUT_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};