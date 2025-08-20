import { Node } from '../types';

export function calculateNodeRadius(title: string, isSelected: boolean = false): number {
  const baseRadius = 0.3;
  const lengthFactor = Math.min(title.length * 0.02, 0.2);
  const selectionBonus = isSelected ? 0.1 : 0;
  return baseRadius + lengthFactor + selectionBonus;
}

export function calculateLabelSize(title: string): { width: number; height: number } {
  const charWidth = 0.05;
  const lineHeight = 0.08;
  const lines = Math.ceil(title.length / 20);
  
  return {
    width: Math.min(title.length * charWidth, 20 * charWidth),
    height: lines * lineHeight
  };
}

export function getNodeAtPosition(
  nodes: Node[],
  position: { x: number; y: number; z: number },
  threshold: number = 0.5
): Node | null {
  let closest: { node: Node; distance: number } | null = null;
  
  for (const node of nodes) {
    if (!node.position) continue;
    
    const distance = Math.sqrt(
      Math.pow(node.position.x - position.x, 2) +
      Math.pow(node.position.y - position.y, 2) +
      Math.pow(node.position.z - position.z, 2)
    );
    
    if (distance <= threshold && (!closest || distance < closest.distance)) {
      closest = { node, distance };
    }
  }
  
  return closest?.node || null;
}

export function generateSphericalPosition(radius: number = 3): { x: number; y: number; z: number } {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi)
  };
}

export function interpolatePosition(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  t: number
): { x: number; y: number; z: number } {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t
  };
}
